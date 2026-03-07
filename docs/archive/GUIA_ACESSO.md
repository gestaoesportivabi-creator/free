# 🚀 Guia de Acesso - SCOUT 21 PRO

## 📍 Localização do Projeto
```
C:\Users\maicon John\21Scoutpro
```

## 🔑 Como Acessar e Fazer Login

### **Opção 1: Usar o arquivo .bat (Mais Fácil)**

1. Abra a pasta do projeto no Windows Explorer:
   ```
   C:\Users\maicon John\21Scoutpro
   ```

2. Clique duas vezes no arquivo `iniciar.bat`

3. Aguarde o servidor iniciar (aparecerá uma janela preta do PowerShell)

4. O navegador deve abrir automaticamente, ou acesse manualmente:
   ```
   http://localhost:5173
   ```

### **Opção 2: Usar PowerShell/Terminal**

1. Abra o PowerShell (Windows + X e escolha "Windows PowerShell" ou "Terminal")

2. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\maicon John\21Scoutpro"
   ```

3. Execute o comando para iniciar o servidor:
   ```powershell
   npm run dev
   ```

4. Aguarde a mensagem que aparece no terminal:
   ```
   VITE v5.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ```

5. Abra seu navegador e acesse:
   ```
   http://localhost:5173
   ```

---

## 🔐 Credenciais de Login

### **Para Entrar:**
- **E-mail:** Qualquer e-mail (pode usar: `treinador@clube.com`)
- **Senha:** `afc25`

### **Perfis Especiais (senha `afc25`):**

1. **Treinador (Padrão):**
   - E-mail: `treinador@clube.com` ou qualquer e-mail
   - Perfil: Treinador

2. **Atleta:**
   - E-mail: `atleta@clube.com` (deve conter "atleta")
   - Perfil: Atleta (acesso limitado)

3. **Preparador Físico:**
   - E-mail: `fisico@clube.com` (deve conter "fisico")
   - Perfil: Preparador Físico

4. **Diretor:**
   - E-mail: `diretor@clube.com` (deve conter "diretor")
   - Perfil: Diretor

### **Criar Nova Conta:**
- Clique em "Novo no clube? Criar Conta"
- Preencha os dados e escolha a função
- O sistema simula uma aprovação e faz login automaticamente

---

## 📝 Passo a Passo Visual

```
1. Abrir pasta: C:\Users\maicon John\21Scoutpro
2. Clicar duas vezes em: iniciar.bat
3. Aguardar janela do PowerShell abrir
4. Abrir navegador em: http://localhost:5173
5. Fazer login com:
   - E-mail: treinador@clube.com
   - Senha: afc25
6. Pronto! Você está dentro do sistema
```

---

## ⚠️ Problemas Comuns

### **Porta já está em uso:**
Se aparecer erro de porta ocupada:
- O Vite usará outra porta automaticamente (5174, 5175, etc.)
- Veja a mensagem no terminal para saber qual porta usar

### **Tela preta:**
- Pressione `Ctrl + Shift + R` para recarregar sem cache
- Verifique o console do navegador (F12) para erros

### **Servidor não inicia:**
- Certifique-se de que o Node.js está instalado
- Execute `npm install` primeiro (se necessário)

---

## 🛑 Como Parar o Servidor

No terminal onde está rodando, pressione:
```
Ctrl + C
```

---

## 📂 Estrutura do Projeto

```
21Scoutpro/
├── iniciar.bat          ← Clique aqui para iniciar
├── iniciar.ps1          ← Script PowerShell alternativo
├── package.json         ← Dependências do projeto
├── index.html           ← Página principal
├── App.tsx              ← Componente principal
├── components/          ← Componentes React
└── ...
```

---

**✅ Tudo pronto! Basta executar o `iniciar.bat` e acessar http://localhost:5173**












