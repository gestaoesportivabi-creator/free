# 🚀 Guia de Deploy - SCOUT 21 PRO

Este guia explica como deixar o sistema SCOUT 21 PRO online e acessível pela internet.

## ⚠️ IMPORTANTE - Sobre os Dados

O sistema atual usa **localStorage** do navegador para salvar dados. Isso significa:
- ✅ Funciona perfeitamente para uso local/pessoal
- ⚠️ Cada usuário terá seus próprios dados (não compartilhados entre dispositivos)
- ⚠️ Dados são salvos no navegador, não em servidor

**Para múltiplos usuários compartilharem dados, seria necessário um backend + banco de dados.**

---

## 📋 Opções de Deploy (Gratuitas)

### **1. VERCEL (RECOMENDADO) - Mais Fácil** ⭐

#### Pré-requisitos:
- Conta no GitHub (gratuita)
- Conta no Vercel (gratuita, use GitHub para criar)

#### Passo a Passo:

1. **Preparar o código no GitHub:**
   ```bash
   # Se ainda não tem, instale o Git
   # Crie uma conta em github.com
   
   # No terminal, na pasta do projeto:
   git init
   git add .
   git commit -m "Initial commit"
   
   # Crie um repositório no GitHub e depois:
   git remote add origin https://github.com/SEU_USUARIO/scout-21-pro.git
   git branch -M main
   git push -u origin main
   ```

2. **Fazer Deploy no Vercel:**
   - Acesse: https://vercel.com
   - Clique em "Sign Up" e faça login com GitHub
   - Clique em "Add New" → "Project"
   - Conecte seu repositório do GitHub
   - O Vercel detectará automaticamente que é um projeto Vite
   - Clique em "Deploy"
   - Pronto! Em 1-2 minutos seu site estará online

3. **URL Gerada:**
   - Será algo como: `https://scout-21-pro.vercel.app`
   - Você pode personalizar o domínio depois

#### Vantagens:
- ✅ Deploy automático a cada push no GitHub
- ✅ HTTPS automático
- ✅ CDN global (site rápido no mundo todo)
- ✅ Zero configuração necessária

---

### **2. NETLIFY - Alternativa Simples**

#### Pré-requisitos:
- Conta no GitHub
- Conta no Netlify (gratuita)

#### Passo a Passo:

1. **Preparar no GitHub** (mesmo processo do Vercel acima)

2. **Fazer Deploy no Netlify:**
   - Acesse: https://netlify.com
   - Clique em "Sign up" e faça login com GitHub
   - Clique em "Add new site" → "Import an existing project"
   - Conecte seu repositório do GitHub
   - Configure:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Clique em "Deploy site"
   - Pronto!

3. **URL Gerada:**
   - Será algo como: `https://scout-21-pro.netlify.app`

#### Vantagens:
- ✅ Similar ao Vercel
- ✅ Bom suporte para React/Vite

---

### **3. GITHUB PAGES - Gratuito mas Mais Trabalhoso**

#### Passo a Passo:

1. **Instalar plugin do Vite:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Adicionar script no package.json:**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Configurar vite.config.ts:**
   ```typescript
   export default {
     base: '/nome-do-repositorio/' // Se não for raiz
   }
   ```

4. **Fazer deploy:**
   ```bash
   npm run deploy
   ```

5. **Ativar GitHub Pages:**
   - No GitHub: Settings → Pages
   - Source: gh-pages branch
   - URL: `https://SEU_USUARIO.github.io/nome-repositorio`

---

### **4. FIREBASE HOSTING**

#### Passo a Passo:

1. **Instalar Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Inicializar:**
   ```bash
   firebase init hosting
   ```
   - Selecione: Use an existing project ou crie um novo
   - Public directory: `dist`
   - Configure as opções

4. **Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## 🔧 Configuração do Build

O projeto já está configurado corretamente. Para testar localmente:

```bash
npm run build
npm run preview
```

Isso criará a pasta `dist` com os arquivos otimizados para produção.

---

## 📝 Checklist Antes do Deploy

- [ ] Testar o build localmente (`npm run build`)
- [ ] Verificar se não há erros no console
- [ ] Testar todas as funcionalidades principais
- [ ] Criar conta na plataforma escolhida (Vercel/Netlify)
- [ ] Ter o código no GitHub (recomendado)

---

## 🌐 Domínio Personalizado (Opcional)

Tanto Vercel quanto Netlify permitem usar seu próprio domínio:

1. **Vercel:**
   - Settings → Domains → Add Domain
   - Configure o DNS conforme instruções

2. **Netlify:**
   - Site settings → Domain management → Add custom domain
   - Configure o DNS conforme instruções

---

## ⚡ Deploy Contínuo

Após o primeiro deploy, sempre que você fizer `git push`:
- **Vercel/Netlify:** Deploy automático
- **GitHub Pages:** Execute `npm run deploy`

---

## 🆘 Problemas Comuns

### **Página em branco após deploy:**
- Verifique se o `base` no `vite.config.ts` está correto
- Confira se os arquivos de configuração (vercel.json/netlify.toml) existem

### **Erro 404 ao navegar:**
- O arquivo `vercel.json` ou `netlify.toml` deve redirecionar todas as rotas para `index.html`
- Já estão criados neste projeto ✅

### **Imagens não carregam:**
- Certifique-se que as imagens estão na pasta `public/`
- Use caminhos relativos começando com `/`

---

## 📊 Recomendação Final

**Para iniciantes:** Use **Vercel** - é o mais simples e rápido!

1. Crie conta no GitHub
2. Faça upload do código
3. Conecte no Vercel
4. Clique em Deploy
5. Pronto! 🎉

---

**Dúvidas?** Verifique a documentação oficial:
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- GitHub Pages: https://pages.github.com









