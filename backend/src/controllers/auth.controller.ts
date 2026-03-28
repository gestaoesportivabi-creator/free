/**
 * Controller para Autenticação
 * Nota: Rotas de auth não usam tenant middleware
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

const ALLOWED_REGISTER_ROLES = ['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE'];
/** Planos que podem ser atribuídos pelo admin (não inclui ADMINISTRADOR) */
const ADMIN_ASSIGNABLE_ROLES = ['ESSENCIAL', 'COMPETICAO', 'PERFORMANCE'];

function mapRoleForFrontend(roleName: string): string {
  const MAP: Record<string, string> = {
    'ADMINISTRADOR': 'TECNICO',
    'ESSENCIAL': 'TECNICO',
    'COMPETICAO': 'TECNICO',
    'PERFORMANCE': 'TECNICO',
  };
  return MAP[roleName] ?? roleName;
}

/** Erros de conexão Prisma/Postgres (ex.: Supabase pausado ou URL errada). */
function isDatabaseUnavailable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Tenant or user not found') ||
    msg.includes("Can't reach database server") ||
    msg.includes('P1001') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND')
  );
}

export const authController = {
  /**
   * POST /api/auth/login
   */
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email/nome e senha são obrigatórios',
        });
      }

      let identifier = String(email).trim();

      // Atalho: "admin" aceito como admin@admin.com (credenciais padrão do seed)
      if (identifier.toLowerCase() === 'admin') {
        identifier = 'admin@admin.com';
      }

      // Buscar por email primeiro; se não encontrar, buscar por nome
      // Usar select para não depender de colunas opcionais (ex.: team_display_name) que podem não existir no DB
      let user = await prisma.user.findUnique({
        where: { email: identifier },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isActive: true,
          role: { select: { name: true } },
        },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { name: { equals: identifier, mode: 'insensitive' } },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            isActive: true,
            role: { select: { name: true } },
          },
        });
      }

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Credenciais inválidas');
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        throw new UnauthorizedError('Credenciais inválidas');
      }

      // Atualizar lastLoginAt
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => { /* coluna pode não existir antes da migration */ });

      // Gerar token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: mapRoleForFrontend(user.role.name),
            isPlatformAdmin: user.role.name === 'ADMINISTRADOR',
          },
        },
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }
      if (isDatabaseUnavailable(error)) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/login] Banco indisponível:', error);
        }
        return res.status(503).json({
          success: false,
          error:
            'Banco de dados indisponível. Verifique no Supabase se o projeto está ativo (não pausado) e se DATABASE_URL / DIRECT_URL no arquivo backend/.env estão corretas (Settings → Database).',
        });
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/login] Erro 500:', error);
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer login',
      });
    }
  },

  /**
   * POST /api/auth/register
   */
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name, roleName = 'ESSENCIAL' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, senha e nome são obrigatórios',
        });
      }

      if (!ALLOWED_REGISTER_ROLES.includes(roleName)) {
        return res.status(400).json({
          success: false,
          error: 'Role não permitida para auto-registro',
        });
      }

      // Verificar limite de cadastro
      if (env.MAX_REGISTERED_USERS) {
        const currentCount = await prisma.user.count({ where: { isActive: true } });
        if (currentCount >= env.MAX_REGISTERED_USERS) {
          return res.status(400).json({
            success: false,
            error: 'Limite máximo de usuários atingido. Contacte o administrador.',
          });
        }
      }

      // Verificar se usuário já existe (select mínimo: evita SELECT em colunas ausentes no DB, ex.: last_login_at)
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado',
        });
      }

      // Buscar role
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Role inválida',
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          roleId: role.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: { select: { name: true } },
        },
      });

      // Criar registro específico baseado no role
      if (roleName === 'ESSENCIAL') {
        await prisma.tecnico.create({
          data: {
            userId: user.id,
            nome: user.name,
          },
        });
      } else if (roleName === 'COMPETICAO') {
        // Se houver dados do clube no body, usar; senão, usar nome do usuário
        const { razaoSocial, cnpj, cidade, estado } = req.body;
        await prisma.clube.create({
          data: {
            userId: user.id,
            razaoSocial: razaoSocial || user.name,
            cnpj: cnpj || '',
            cidade: cidade || null,
            estado: estado || null,
          },
        });
      }

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: mapRoleForFrontend(user.role.name),
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Erro ao criar conta',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      });
    }
  },

  /**
   * POST /api/auth/admin/users
   * Cadastro de utilizador pela área admin — qualquer plano exceto ADMINISTRADOR.
   */
  adminCreateUser: async (req: Request, res: Response) => {
    try {
      const { email, password, name, roleName = 'ESSENCIAL' } = req.body as {
        email?: string;
        password?: string;
        name?: string;
        roleName?: string;
      };

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, senha e nome são obrigatórios',
        });
      }

      if (!ADMIN_ASSIGNABLE_ROLES.includes(roleName)) {
        return res.status(400).json({
          success: false,
          error: 'Plano não permitido. Não é possível cadastrar administrador por aqui.',
        });
      }

      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres.',
        });
      }

      if (env.MAX_REGISTERED_USERS) {
        const currentCount = await prisma.user.count({ where: { isActive: true } });
        if (currentCount >= env.MAX_REGISTERED_USERS) {
          return res.status(400).json({
            success: false,
            error: 'Limite máximo de usuários atingido.',
          });
        }
      }

      const existing = await prisma.user.findUnique({
        where: { email: String(email).trim() },
        select: { id: true },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado',
        });
      }

      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });
      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Plano inválido',
        });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const displayName = String(name).trim();

      const user = await prisma.user.create({
        data: {
          email: String(email).trim(),
          passwordHash,
          name: displayName,
          roleId: role.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: { select: { name: true, description: true } },
        },
      });

      if (roleName === 'ESSENCIAL') {
        await prisma.tecnico.create({
          data: {
            userId: user.id,
            nome: user.name,
          },
        });
      } else if (roleName === 'COMPETICAO') {
        const { razaoSocial, cnpj, cidade, estado } = req.body as {
          razaoSocial?: string;
          cnpj?: string;
          cidade?: string;
          estado?: string;
        };
        const suffix = user.id.replace(/-/g, '').slice(0, 12);
        const safeCnpj =
          cnpj && String(cnpj).trim()
            ? String(cnpj).trim().slice(0, 18)
            : `ADM${suffix}`.padEnd(18, '0').slice(0, 18);
        await prisma.clube.create({
          data: {
            userId: user.id,
            razaoSocial: razaoSocial ? String(razaoSocial).trim() : user.name,
            cnpj: safeCnpj,
            cidade: cidade != null ? String(cidade).trim() || null : null,
            estado: estado != null ? String(estado).trim().slice(0, 2) || null : null,
          },
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          roleDescription: user.role.description,
          createdAt: user.createdAt,
        },
      });
    } catch (error: unknown) {
      console.error('Erro ao cadastrar usuário (admin):', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao cadastrar usuário',
      });
    }
  },

  /**
   * GET /api/auth/profile
   * Retorna dados do usuário autenticado (usado para restaurar sessão ao atualizar a página)
   */
  profile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      // select só com colunas que existem sem a migração 018 (evita 500 se team_* não existirem)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          photoUrl: true,
          isActive: true,
          role: { select: { name: true } },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado ou inativo',
        });
      }

      const data: { id: string; name: string; email: string; role: string; isPlatformAdmin: boolean; photoUrl?: string; teamDisplayName?: string; teamShieldUrl?: string } = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: mapRoleForFrontend(user.role.name),
        isPlatformAdmin: user.role.name === 'ADMINISTRADOR',
        photoUrl: user.photoUrl ?? undefined,
      };
      // Incluir team* se as colunas existirem (após migração 018) — busca em segundo passo para não quebrar sem migração
      try {
        const ext = await prisma.user.findUnique({
          where: { id: userId },
          select: { teamDisplayName: true, teamShieldUrl: true },
        });
        if (ext) {
          data.teamDisplayName = ext.teamDisplayName ?? undefined;
          data.teamShieldUrl = ext.teamShieldUrl ?? undefined;
        }
      } catch (_) {
        // colunas team_* podem não existir
      }

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar perfil do usuário',
      });
    }
  },

  /**
   * PUT /api/auth/profile
   * Atualiza dados do usuário autenticado (nome, email, foto, senha)
   */
  /**
   * GET /api/auth/admin/users
   * Lista todos os usuários da plataforma (admin only — excluindo o admin atual)
   */
  listUsers: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: req.user!.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { name: true, description: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // lastLoginAt: só consultar se a coluna existir (evita P2022 e logs de erro do Prisma)
      let lastLoginMap: Record<string, Date | null> = {};
      const ids = users.map(u => u.id);
      if (ids.length > 0) {
        try {
          const rows = await prisma.$queryRaw<{ id: string; last_login_at: Date | null }[]>`
            SELECT id, last_login_at
            FROM users
            WHERE id IN (${Prisma.join(ids)})
          `;
          lastLoginMap = Object.fromEntries(rows.map(r => [r.id, r.last_login_at]));
        } catch {
          lastLoginMap = {};
        }
      }

      return res.json({
        success: true,
        data: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role.name,
          roleDescription: u.role.description,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          lastLoginAt: lastLoginMap[u.id] ?? null,
        })),
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar usuários',
      });
    }
  },

  /**
   * GET /api/auth/admin/stats
   * Estatísticas da plataforma (admin only)
   */
  /**
   * PATCH /api/auth/admin/users/:userId
   * Atualiza e-mail, senha e/ou plano (role) de outro utilizador — apenas admin da plataforma.
   */
  adminUpdateUser: async (req: Request, res: Response) => {
    try {
      const targetId = req.params.userId;
      const adminId = req.user!.id;

      if (targetId === adminId) {
        return res.status(403).json({
          success: false,
          error: 'Não é possível alterar a própria conta por esta rota.',
        });
      }

      const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          role: { select: { id: true, name: true, description: true } },
          tecnico: true,
          clube: true,
        },
      });

      if (!target || !target.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado ou inativo.',
        });
      }

      const body = req.body as {
        email?: string;
        password?: string;
        roleName?: string;
      };

      const newEmail =
        body.email != null && String(body.email).trim() !== ''
          ? String(body.email).trim()
          : undefined;
      const newPassword =
        body.password != null && String(body.password).length > 0
          ? String(body.password)
          : undefined;
      const newRoleName =
        body.roleName != null && String(body.roleName).trim() !== ''
          ? String(body.roleName).trim()
          : undefined;

      if (!newEmail && !newPassword && !newRoleName) {
        return res.status(400).json({
          success: false,
          error: 'Informe e-mail, senha ou plano para atualizar.',
        });
      }

      if (newEmail) {
        const dup = await prisma.user.findFirst({
          where: { email: newEmail, id: { not: targetId } },
          select: { id: true },
        });
        if (dup) {
          return res.status(400).json({
            success: false,
            error: 'Este e-mail já está em uso por outra conta.',
          });
        }
      }

      if (newPassword !== undefined && newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres.',
        });
      }

      if (newRoleName !== undefined && !ADMIN_ASSIGNABLE_ROLES.includes(newRoleName)) {
        return res.status(400).json({
          success: false,
          error: 'Plano inválido. Use Essencial, Competição ou Performance.',
        });
      }

      const newRoleRecord =
        newRoleName !== undefined
          ? await prisma.role.findUnique({ where: { name: newRoleName } })
          : null;
      if (newRoleName !== undefined && !newRoleRecord) {
        return res.status(400).json({
          success: false,
          error: 'Plano não encontrado no sistema.',
        });
      }

      const needsTenantSwitch =
        newRoleRecord !== null && newRoleRecord.name !== target.role.name;

      if (needsTenantSwitch && newRoleRecord) {
        try {
          await prisma.$transaction(async tx => {
            const u = await tx.user.findUnique({
              where: { id: targetId },
              select: {
                id: true,
                name: true,
                tecnico: true,
                clube: true,
              },
            });
            if (!u) throw new Error('USER_GONE');

            const roleNameTarget = newRoleRecord.name;

            const ensureTecnicoPath = async () => {
              if (u.clube) {
                const nEq = await tx.equipe.count({ where: { clubeId: u.clube.id } });
                if (nEq > 0) {
                  throw new Error('CLUBE_HAS_EQUIPES');
                }
                await tx.clube.delete({ where: { id: u.clube.id } });
              }
              const fresh = await tx.user.findUnique({
                where: { id: targetId },
                select: { tecnico: true },
              });
              if (!fresh?.tecnico) {
                await tx.tecnico.create({
                  data: { userId: targetId, nome: u.name },
                });
              }
            };

            const ensureClubePath = async () => {
              if (u.tecnico) {
                const nEq = await tx.equipe.count({ where: { tecnicoId: u.tecnico.id } });
                if (nEq > 0) {
                  throw new Error('TECNICO_HAS_EQUIPES');
                }
                await tx.tecnico.delete({ where: { id: u.tecnico.id } });
              }
              const fresh = await tx.user.findUnique({
                where: { id: targetId },
                select: { clube: true },
              });
              if (!fresh?.clube) {
                const suffix = targetId.replace(/-/g, '').slice(0, 12);
                const cnpj = `ADM${suffix}`.padEnd(18, '0').slice(0, 18);
                await tx.clube.create({
                  data: {
                    userId: targetId,
                    razaoSocial: u.name,
                    cnpj,
                  },
                });
              }
            };

            if (roleNameTarget === 'ESSENCIAL' || roleNameTarget === 'PERFORMANCE') {
              await ensureTecnicoPath();
            } else if (roleNameTarget === 'COMPETICAO') {
              await ensureClubePath();
            }

            const data: { email?: string; passwordHash?: string; roleId?: string } = {
              roleId: newRoleRecord.id,
            };
            if (newEmail) data.email = newEmail;
            if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10);

            await tx.user.update({
              where: { id: targetId },
              data,
            });
          });
        } catch (e: unknown) {
          const code = e instanceof Error ? e.message : '';
          if (code === 'CLUBE_HAS_EQUIPES') {
            return res.status(400).json({
              success: false,
              error:
                'Não é possível mudar o plano: este usuário tem equipes vinculadas ao cadastro de clube. Remova ou transfira as equipes antes.',
            });
          }
          if (code === 'TECNICO_HAS_EQUIPES') {
            return res.status(400).json({
              success: false,
              error:
                'Não é possível mudar o plano: este usuário tem equipes vinculadas ao técnico. Remova ou transfira as equipes antes.',
            });
          }
          throw e;
        }

        const updated = await prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true, description: true } },
          },
        });

        return res.json({
          success: true,
          data: {
            id: updated!.id,
            name: updated!.name,
            email: updated!.email,
            role: updated!.role.name,
            roleDescription: updated!.role.description,
          },
        });
      }

      const updateData: { email?: string; passwordHash?: string } = {};
      if (newEmail) updateData.email = newEmail;
      if (newPassword) updateData.passwordHash = await bcrypt.hash(newPassword, 10);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhuma alteração aplicável (plano já é o selecionado).',
        });
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true, description: true } },
        },
      });

      return res.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role.name,
          roleDescription: updated.role.description,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário (admin):', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar usuário.',
      });
    }
  },

  adminStats: async (_req: Request, res: Response) => {
    try {
      const totalUsers = await prisma.user.count({ where: { isActive: true } });
      const maxUsers = env.MAX_REGISTERED_USERS || null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, isActive: true },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const registrationsByDay: Record<string, number> = {};
      recentUsers.forEach(u => {
        const day = u.createdAt.toISOString().slice(0, 10);
        registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalUsers,
          maxUsers,
          remainingSlots: maxUsers ? Math.max(0, maxUsers - totalUsers) : null,
          registrationsByDay,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar stats admin:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas',
      });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      const { name, email, photoUrl, password, teamDisplayName, teamShieldUrl } = req.body as {
        name?: string;
        email?: string;
        photoUrl?: string;
        password?: string;
        teamDisplayName?: string;
        teamShieldUrl?: string;
      };

      const updateData: { name?: string; email?: string; photoUrl?: string | null; passwordHash?: string; teamDisplayName?: string | null; teamShieldUrl?: string | null } = {};
      if (name != null && String(name).trim()) updateData.name = String(name).trim();
      if (email != null && String(email).trim()) updateData.email = String(email).trim();
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl ? String(photoUrl) : null;
      if (teamDisplayName !== undefined) updateData.teamDisplayName = teamDisplayName != null && String(teamDisplayName).trim() ? String(teamDisplayName).trim() : null;
      if (teamShieldUrl !== undefined) updateData.teamShieldUrl = teamShieldUrl != null && String(teamShieldUrl).length > 0 ? String(teamShieldUrl) : null;
      if (password != null && String(password).length >= 4) {
        updateData.passwordHash = await bcrypt.hash(String(password), 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum dado válido para atualizar',
        });
      }

      if (updateData.email) {
        const existing = await prisma.user.findFirst({
          where: { email: updateData.email, id: { not: userId } },
          select: { id: true },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            error: 'Este e-mail já está em uso por outra conta',
          });
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          photoUrl: true,
          teamDisplayName: true,
          teamShieldUrl: true,
          role: { select: { name: true } },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado ou inativo',
        });
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: mapRoleForFrontend(user.role.name),
          isPlatformAdmin: user.role.name === 'ADMINISTRADOR',
          photoUrl: user.photoUrl,
          teamDisplayName: user.teamDisplayName ?? undefined,
          teamShieldUrl: user.teamShieldUrl ?? undefined,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar perfil',
      });
    }
  },
};

