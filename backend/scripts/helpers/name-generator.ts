/**
 * Gerador de nomes brasileiros realistas
 */

const PRIMEIROS_NOMES = [
  'João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno', 'Thiago', 'Carlos', 'André',
  'Marcos', 'Ricardo', 'Daniel', 'Eduardo', 'Fernando', 'Gustavo', 'Henrique', 'Igor', 'Juliano', 'Leonardo',
  'Matheus', 'Nicolas', 'Otávio', 'Paulo', 'Renato', 'Sérgio', 'Tiago', 'Vinicius', 'Wagner', 'Yuri',
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana',
  'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Sandra', 'Tatiana', 'Vanessa', 'Yasmin', 'Zélia'
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Costa',
  'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
  'Dias', 'Monteiro', 'Cardoso', 'Mendes', 'Araújo', 'Cavalcanti', 'Nunes', 'Moreira', 'Freitas', 'Gomes',
  'Melo', 'Castro', 'Ramos', 'Teixeira', 'Correia', 'Machado', 'Azevedo', 'Pinto', 'Reis', 'Nascimento'
];

export function generateBrazilianName(): string {
  const primeiroNome = PRIMEIROS_NOMES[Math.floor(Math.random() * PRIMEIROS_NOMES.length)];
  const sobrenome1 = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  const sobrenome2 = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  
  // 70% chance de ter 2 sobrenomes, 30% de ter 1
  if (Math.random() < 0.7) {
    return `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
  }
  return `${primeiroNome} ${sobrenome1}`;
}

export function generateNickname(fullName: string): string {
  const primeiroNome = fullName.split(' ')[0];
  const apelidos = ['Júnior', 'Neto', 'Duda', 'Dinho', 'Tito', 'Léo', 'Guga', 'Beto', 'Zé', 'Chico'];
  
  // 50% chance de ter apelido
  if (Math.random() < 0.5) {
    return `${primeiroNome} ${apelidos[Math.floor(Math.random() * apelidos.length)]}`;
  }
  return primeiroNome;
}

export function generateTeamName(categoria: string): string {
  const prefixos = ['Atlético', 'Sport', 'Futebol', 'Clube', 'Associação', 'Esporte'];
  const sufixos = ['Futsal', 'FC', 'Clube', 'Esporte', 'Team'];
  const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza'];
  
  const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
  const cidade = cidades[Math.floor(Math.random() * cidades.length)];
  const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
  
  return `${prefixo} ${cidade} ${sufixo}`;
}
