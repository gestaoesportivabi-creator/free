/**
 * Controller para Autenticação
 * Nota: Rotas de auth não usam tenant middleware
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

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
          error: 'Email e senha são obrigatórios',
        });
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Credenciais inválidas');
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        throw new UnauthorizedError('Credenciais inválidas');
      }

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
            role: user.role.name,
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
      const { email, password, name, roleName = 'TECNICO' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, senha e nome são obrigatórios',
        });
      }

      // Verificar se usuário já existe
      const existing = await prisma.user.findUnique({
        where: { email },
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
        include: { role: true },
      });

      // Criar registro específico baseado no role
      if (roleName === 'TECNICO') {
        await prisma.tecnico.create({
          data: {
            userId: user.id,
            nome: user.name,
          },
        });
      } else if (roleName === 'CLUBE') {
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
            role: user.role.name,
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
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
          role: user.role.name,
          photoUrl: user.photoUrl,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar perfil do usuário',
      });
    }
  },
};

