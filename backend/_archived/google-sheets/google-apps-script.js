/**
 * ============================================
 * SCOUT 21 PRO - Google Apps Script API
 * ============================================
 * 
 * INSTRUÇÕES:
 * 1. Abra sua planilha no Google Sheets
 * 2. Vá em: Extensões > Apps Script
 * 3. DELETE todo o código existente
 * 4. COLE este código completo
 * 5. Salve o projeto (Ctrl+S)
 * 6. Execute a função "doGet" uma vez para autorizar
 * 7. Publique como aplicativo web:
 *    - Publicar > Implantar como aplicativo da web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa, mesmo sem login
 *    - Copie a URL gerada
 * 
 * ============================================
 */

// ⚙️ CONFIGURAÇÃO - ID da Planilha (já configurado)
const SPREADSHEET_ID = '1h1EeCezkEfFZ-oxObrs3G8f0f4DODEsTXv10WYduL2w';

// Nomes das abas (deve corresponder exatamente aos nomes na planilha)
const SHEETS = {
  players: 'players',
  matches: 'matches',
  matchPlayerStats: 'match_player_stats',
  injuries: 'injuries',
  assessments: 'assessments',
  schedules: 'schedules',
  scheduleDays: 'schedule_days',
  budgetEntries: 'budget_entries',
  budgetExpenses: 'budget_expenses',
  competitions: 'competitions',
  statTargets: 'stat_targets',
  users: 'users',
  timeControls: 'time_controls', // Nova aba para controle de tempo jogado
  championshipMatches: 'championship_matches' // Nova aba para tabela de campeonato
};

/**
 * ============================================
 * FUNÇÕES AUXILIARES
 * ============================================
 */

// Obter planilha ativa - CORRIGIDO
function getSpreadsheet() {
  try {
    // Se o script está dentro da planilha (Extensões > Apps Script), use:
    return SpreadsheetApp.getActiveSpreadsheet();
    
    // Se o script está separado, descomente a linha abaixo e comente a linha acima:
    // return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    Logger.log('Erro ao obter planilha: ' + error.toString());
    throw error;
  }
}

// Obter aba específica
function getSheet(sheetName) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Se a aba não existir, criar automaticamente
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  } catch (error) {
    Logger.log('Erro ao obter aba ' + sheetName + ': ' + error.toString());
    throw error;
  }
}

// Converter linha para objeto (baseado nos headers)
function rowToObject(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((header, index) => {
    if (header) {
      let value = row[index];
      // Se for string que parece JSON, tentar parsear
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Se não conseguir parsear, manter como string
        }
      }
      obj[header] = value || null;
    }
  });
  return obj;
}

// Converter objeto para linha (baseado nos headers)
function objectToRow(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.map((header, index) => {
    // Normalizar header (remover espaços e converter para minúscula para comparação)
    const normalizedHeader = String(header).trim().toLowerCase();
    
    // Procurar a chave correspondente no objeto (case-insensitive)
    let key = header;
    if (!(header in obj)) {
      // Tentar encontrar a chave case-insensitive
      const foundKey = Object.keys(obj).find(k => String(k).trim().toLowerCase() === normalizedHeader);
      if (foundKey) {
        key = foundKey;
      }
    }
    
    if (obj[key] === undefined) {
      // Log apenas para campos importantes como 'id'
      if (normalizedHeader === 'id') {
        Logger.log('⚠️ Campo "id" não encontrado no objeto! Chaves disponíveis: ' + Object.keys(obj).join(', '));
      }
      return '';
    }
    const value = obj[key];
    // Se for objeto ou array, converter para JSON string
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      try {
        const jsonString = JSON.stringify(value);
        Logger.log('Convertendo ' + header + ' para JSON: ' + jsonString.substring(0, 100));
        return jsonString;
      } catch (e) {
        Logger.log('Erro ao converter ' + header + ' para JSON: ' + e.toString());
        return '';
      }
    }
    return value;
  });
}

// Obter todos os dados de uma aba
function getAllData(sheetName) {
  try {
    Logger.log('📋 getAllData chamado para aba: ' + sheetName);
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    Logger.log('📊 Última linha da aba ' + sheetName + ': ' + lastRow);
    if (lastRow <= 1) {
      Logger.log('⚠️ Aba ' + sheetName + ' está vazia ou só tem header');
      return [];
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('📋 Headers da aba ' + sheetName + ': ' + headers.join(', '));
    if (!headers || headers.length === 0) {
      Logger.log('⚠️ Aba ' + sheetName + ' não tem headers');
      return [];
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    Logger.log('📊 Linhas de dados obtidas: ' + data.length);
    
    const result = data.map((row, rowIndex) => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) {
          let value = row[index];
          // Se for string que parece JSON, tentar parsear
          if (typeof value === 'string' && value.trim() !== '' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
            try {
              const parsed = JSON.parse(value);
              value = parsed;
            } catch (e) {
              Logger.log('Erro ao parsear JSON do campo ' + header + ': ' + e.toString() + ' | Valor: ' + value.substring(0, 100));
              // Se não conseguir parsear, manter como string
            }
          }
          // Converter valores vazios para null
          if (value === '' || value === null || value === undefined) {
            value = null;
          }
          // Normalizar nome do header (remover espaços e converter para minúscula para comparação)
          const normalizedHeader = String(header).trim();
          obj[normalizedHeader] = value;
        }
      });
      // Se não tiver ID, gerar um baseado no índice
      if (!obj.id && !obj.ID && !obj.Id) {
        obj.id = 'champ_' + (rowIndex + 1);
      }
      return obj;
    });
    
    Logger.log('📊 Resultado final: ' + result.length + ' registros processados');
    if (result.length > 0) {
      Logger.log('📋 Primeiro registro processado: ' + JSON.stringify(result[0]).substring(0, 200));
    }
    return result;
  } catch (error) {
    Logger.log('Erro ao obter todos os dados de ' + sheetName + ': ' + error.toString());
    return [];
  }
}

// Obter registro por ID
function getDataById(sheetName, id) {
  try {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return null;
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumn = headers.indexOf('id');
    if (idColumn === -1) return null;
    
    // Converter ID para string para comparação correta
    const idStr = String(id);
    
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (let i = 0; i < data.length; i++) {
      // Comparar como strings para garantir compatibilidade
      if (String(data[i][idColumn]) === idStr) {
        const obj = {};
        headers.forEach((header, index) => {
          if (header) {
            let value = data[i][index];
            // Se for string que parece JSON, tentar parsear
            if (typeof value === 'string' && value.trim() !== '' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
              try {
                const parsed = JSON.parse(value);
                value = parsed;
              } catch (e) {
                Logger.log('Erro ao parsear JSON do campo ' + header + ' (getDataById): ' + e.toString() + ' | Valor: ' + (value ? value.substring(0, 100) : 'null'));
                // Se não conseguir parsear, manter como string
              }
            }
            if (value === '' || value === null || value === undefined) {
              value = null;
            }
            obj[header] = value;
          }
        });
        return obj;
      }
    }
    return null;
  } catch (error) {
    Logger.log('Erro ao obter dados por ID de ' + sheetName + ': ' + error.toString());
    return null;
  }
}

// Inserir novo registro
function insertData(sheetName, data) {
  try {
    const sheet = getSheet(sheetName);
    
    Logger.log('📝 insertData chamado - sheetName: ' + sheetName);
    Logger.log('📝 Dados recebidos (keys): ' + Object.keys(data).join(', '));
    Logger.log('📝 ID nos dados: ' + (data.id || 'NÃO TEM ID!'));
    
    // Se a aba estiver vazia, criar headers se necessário
    if (sheet.getLastRow() === 0) {
      const headers = Object.keys(data);
      Logger.log('📋 Criando headers na aba vazia: ' + headers.join(', '));
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('📋 Headers existentes na planilha: ' + headers.join(', '));
    
    // Verificar se a coluna 'id' existe (case-insensitive)
    let idColumnIndex = headers.findIndex(h => String(h).trim().toLowerCase() === 'id');
    Logger.log('🔍 Índice da coluna id: ' + idColumnIndex);
    
    // Se não existe coluna 'id' mas o dado tem ID, adicionar a coluna como primeira coluna
    if (idColumnIndex === -1 && data.id) {
      Logger.log('⚠️ Coluna "id" não encontrada, adicionando como primeira coluna...');
      sheet.insertColumnBefore(1);
      sheet.getRange(1, 1).setValue('id');
      // Ler headers novamente após inserir a coluna
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log('📋 Headers atualizados após inserir coluna id: ' + headers.join(', '));
    } else if (idColumnIndex === -1 && !data.id) {
      Logger.log('⚠️ ATENÇÃO: Coluna "id" não existe E objeto não tem ID!');
      Logger.log('⚠️ O objeto será salvo SEM ID - isso pode causar problemas!');
    }
    
    // objectToRow já faz a conversão de objetos/arrays para JSON string
    const row = objectToRow(sheet, data);
    Logger.log('📊 Linha gerada (primeiros 3 valores): ' + row.slice(0, 3).join(', '));
    sheet.appendRow(row);
    
    Logger.log('✅ Dados inseridos com sucesso!');
    return { success: true, data: data };
  } catch (error) {
    Logger.log('Erro ao inserir dados em ' + sheetName + ': ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}

// Atualizar registro
function updateData(sheetName, id, data) {
  try {
    Logger.log('updateData chamado - sheetName: ' + sheetName + ', id: ' + id + ', data keys: ' + Object.keys(data).join(', '));
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('Sheet vazio ou sem dados');
      return { success: false, error: 'No data found' };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumn = headers.indexOf('id');
    if (idColumn === -1) {
      Logger.log('Coluna ID não encontrada');
      return { success: false, error: 'ID column not found' };
    }
    
    // Converter ID para string para comparação correta
    const idStr = String(id).trim();
    Logger.log('updateData - Procurando ID: "' + idStr + '" (tipo: ' + typeof id + ')');
    
    // Usar getValue() diretamente da célula para evitar problemas de formatação
    for (let i = 2; i <= lastRow; i++) {
      const cellValue = sheet.getRange(i, idColumn + 1).getValue();
      const rowId = String(cellValue).trim();
      Logger.log('Linha ' + i + ' - ID da célula: "' + rowId + '" (tipo: ' + typeof cellValue + ')');
      // Comparar como strings (com trim para remover espaços)
      if (rowId === idStr) {
        Logger.log('✅ ID encontrado na linha ' + i + '! Atualizando...');
        const rowIndex = i; // i já é o número da linha (loop começa em 2)
        headers.forEach((header, colIndex) => {
          // Verificar se o header existe e se o dado tem essa propriedade
          if (!header) return; // Pular colunas vazias
          
          if (data.hasOwnProperty(header)) {
            const value = data[header];
            
            // Se for objeto ou array, converter para JSON string
            if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
              try {
                const jsonString = JSON.stringify(value);
                Logger.log('Salvando campo ' + header + ' como JSON (tamanho: ' + jsonString.length + ' chars)');
                sheet.getRange(rowIndex, colIndex + 1).setValue(jsonString);
              } catch (e) {
                Logger.log('Erro ao salvar campo ' + header + ': ' + e.toString());
                sheet.getRange(rowIndex, colIndex + 1).setValue('');
              }
            } else {
              // Para campos de data (startDate, endDate), garantir que seja string YYYY-MM-DD
              if ((header === 'startDate' || header === 'endDate') && typeof value === 'string') {
                // Se tem timestamp, extrair apenas a data
                const datePart = value.split('T')[0].split(' ')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                  Logger.log('Normalizando data ' + header + ': ' + value + ' -> ' + datePart);
                  sheet.getRange(rowIndex, colIndex + 1).setValue(datePart);
                } else {
                  sheet.getRange(rowIndex, colIndex + 1).setValue(value);
                }
              } else {
                // Para outros campos, salvar diretamente
                sheet.getRange(rowIndex, colIndex + 1).setValue(value);
              }
            }
          } else {
            // Se o campo não existe nos dados, deixar vazio
            sheet.getRange(rowIndex, colIndex + 1).setValue('');
          }
        });
        const updated = getDataById(sheetName, id);
        Logger.log('Registro atualizado com sucesso!');
        return { success: true, data: { ...updated, ...data } };
      }
    }
    Logger.log('ID não encontrado para atualizar');
    return { success: false, error: 'Record not found' };
  } catch (error) {
    Logger.log('Erro ao atualizar dados em ' + sheetName + ': ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}

// Deletar registro
function deleteData(sheetName, id) {
  try {
    Logger.log('deleteData chamado - sheetName: ' + sheetName + ', id: ' + id + ' (tipo: ' + typeof id + ')');
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    Logger.log('lastRow: ' + lastRow);
    if (lastRow <= 1) {
      Logger.log('Sheet vazio ou sem dados');
      return { success: false, error: 'No data found' };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Headers: ' + JSON.stringify(headers));
    const idColumn = headers.indexOf('id');
    Logger.log('idColumn index: ' + idColumn);
    if (idColumn === -1) {
      Logger.log('Coluna ID não encontrada');
      return { success: false, error: 'ID column not found' };
    }
    
    // Converter ID para string para comparação correta
    const idStr = String(id).trim();
    Logger.log('deleteData - Procurando ID: "' + idStr + '" (tipo: ' + typeof id + ')');
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    Logger.log('Total de linhas para verificar: ' + dataRange.length);
    
    // Coletar todos os IDs para debug
    const allIds = [];
    for (let i = 0; i < dataRange.length; i++) {
      // Obter o valor da célula diretamente para evitar problemas de formatação
      const cellValue = sheet.getRange(i + 2, idColumn + 1).getValue();
      const rowId = String(cellValue).trim();
      allIds.push(rowId);
      Logger.log('Linha ' + (i + 2) + ' - ID da célula: "' + rowId + '" (tipo: ' + typeof cellValue + ')');
      
      // Comparar como strings (com trim para remover espaços)
      if (rowId === idStr) {
        Logger.log('✅ ID encontrado na linha ' + (i + 2) + '! Deletando...');
        const rowIndex = i + 2;
        sheet.deleteRow(rowIndex);
        Logger.log('✅ Linha deletada com sucesso!');
        return { success: true };
      }
    }
    Logger.log('❌ ID não encontrado. ID procurado: "' + idStr + '"');
    Logger.log('❌ IDs disponíveis na planilha: ' + JSON.stringify(allIds));
    return { success: false, error: 'Record not found. ID: ' + idStr + ', Available IDs: ' + allIds.join(', ') };
  } catch (error) {
    Logger.log('Erro ao deletar dados de ' + sheetName + ': ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}

/**
 * ============================================
 * HANDLERS HTTP (GET, POST)
 * ============================================
 * 
 * MÉTODO OVERRIDE PATTERN:
 * - Google Apps Script só suporta GET e POST nativamente
 * - PUT/DELETE são simulados via parâmetro 'method' em POST/GET
 * - Frontend envia: POST com ?method=PUT ou GET com ?method=DELETE
 * - Backend lê e.parameter.method para rotear a ação correta
 * - Isso evita requisições preflight OPTIONS (que causam erro CORS)
 * 
 * CORS:
 * - Google Apps Script Web App retorna CORS headers automaticamente
 *   quando configurado como "Qualquer pessoa, mesmo sem login"
 * - Headers automáticos: Access-Control-Allow-Origin: *
 * - NÃO é possível adicionar headers customizados (limitação da plataforma)
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * Função helper para criar resposta JSON
 * CORS headers são adicionados automaticamente pelo Google Apps Script
 */
function createResponse(jsonData) {
  try {
    const output = ContentService.createTextOutput(JSON.stringify(jsonData));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    Logger.log('Erro ao criar resposta: ' + error.toString());
    const errorOutput = ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    return errorOutput;
  }
}

/**
 * Handler principal para todas as requisições
 * 
 * FLUXO:
 * 1. Lê e.parameter.method para detectar método override (PUT/DELETE)
 * 2. Se não houver method override, usa GET ou POST conforme e.postData
 * 3. Lê path do parâmetro
 * 4. Roteia para a função correta (GET, POST, PUT via POST, DELETE via GET)
 * 5. Retorna resposta JSON consistente
 */
function handleRequest(e) {
  try {
    // 1. Detectar método HTTP via method override pattern
    let method = 'GET';
    let path = e.parameter.path || '';
    let requestData = {};
    
    // Se tem parâmetro method, usar como override (PUT/DELETE simulados)
    if (e.parameter.method) {
      method = e.parameter.method.toUpperCase();
    } else if (e.postData) {
      // Se é POST real, method = POST
      method = 'POST';
    }
    
    // 2. Obter dados do body (para POST/PUT)
    if (e.postData && e.postData.contents) {
      try {
        // Aceitar tanto application/json quanto text/plain (para evitar preflight)
        requestData = JSON.parse(e.postData.contents);
      } catch (err) {
        Logger.log('Erro ao parsear body JSON: ' + err.toString());
        requestData = {};
      }
    }
    
    // Roteamento
    const pathParts = path.split('/').filter(p => p);
    const resource = pathParts[0];
    const id = pathParts[1];
    
    // Mapear nomes de recursos para abas
    const resourceMap = {
      'players': SHEETS.players,
      'matches': SHEETS.matches,
      'match-player-stats': SHEETS.matchPlayerStats,
      'injuries': SHEETS.injuries,
      'assessments': SHEETS.assessments,
      'schedules': SHEETS.schedules,
      'schedule-days': SHEETS.scheduleDays,
      'budget-entries': SHEETS.budgetEntries,
      'budget-expenses': SHEETS.budgetExpenses,
      'competitions': SHEETS.competitions,
      'stat-targets': SHEETS.statTargets,
      'users': SHEETS.users,
      'time-controls': SHEETS.timeControls, // Nova rota para controle de tempo
      'championship-matches': SHEETS.championshipMatches // Nova rota para tabela de campeonato
    };
    
    const sheetName = resourceMap[resource];
    
    if (!sheetName) {
      return createResponse({ 
        success: false, 
        error: 'Resource not found',
        available: Object.keys(resourceMap),
        path: path,
        resource: resource
      });
    }
    
    // 3. Rotear para a função correta baseado no method override
    let result;
    
    if (method === 'GET') {
      // GET /resource ou GET /resource/:id
      if (id) {
        const data = getDataById(sheetName, id);
        result = data ? { success: true, data: data } : { success: false, error: 'Not found' };
      } else {
        Logger.log('🔍 GET request - resource: ' + resource + ', sheetName: ' + sheetName);
        try {
          const data = getAllData(sheetName);
          Logger.log('📊 Dados obtidos de ' + sheetName + ': ' + data.length + ' registros');
          result = { success: true, data: data };
        } catch (error) {
          Logger.log('❌ Erro ao obter dados de ' + sheetName + ': ' + error.toString());
          result = { success: false, error: error.toString(), data: [] };
        }
      }
    } 
    else if (method === 'POST') {
      // POST /resource (CREATE)
      result = insertData(sheetName, requestData);
    }
    else if (method === 'PUT' || method === 'PATCH') {
      // PUT /resource/:id (UPDATE via method override)
      // Frontend: POST com ?method=PUT
      if (!id) {
        result = { success: false, error: 'ID required for update' };
      } else {
        result = updateData(sheetName, id, requestData);
      }
    }
    else if (method === 'DELETE') {
      // DELETE /resource/:id (DELETE via method override)
      // Frontend: GET com ?method=DELETE
      Logger.log('DELETE request - resource: ' + resource + ', id: ' + id + ', sheetName: ' + sheetName);
      if (!id) {
        result = { success: false, error: 'ID required for delete' };
      } else {
        result = deleteData(sheetName, id);
      }
    }
    else {
      result = { success: false, error: 'Method not allowed: ' + method };
    }
    
    // 4. Retornar resposta JSON (CORS headers são automáticos)
    return createResponse(result);
    
  } catch (error) {
    Logger.log('Erro em handleRequest: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return createResponse({ 
      success: false, 
      error: error.toString(),
      message: error.message || ''
    });
  }
}

/**
 * ============================================
 * FUNÇÃO DE TESTE
 * ============================================
 */

function test() {
  try {
    Logger.log('🧪 Testando conexão com planilha...');
    
    // Teste básico
    const ss = getSpreadsheet();
    Logger.log('✅ Planilha obtida com sucesso!');
    Logger.log('📋 Nome da planilha: ' + ss.getName());
    
    // Teste obter aba
    const sheet = getSheet('players');
    Logger.log('✅ Aba obtida/criada com sucesso!');
    
    // Teste obter dados
    const data = getAllData('players');
    Logger.log('✅ Dados obtidos: ' + data.length + ' registros');
    
    Logger.log('✅✅✅ Todos os testes passaram! ✅✅✅');
    return 'Teste concluído com sucesso! Veja os logs acima.';
  } catch (error) {
    Logger.log('❌ Erro no teste: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return 'Erro no teste. Veja os logs.';
  }
}


