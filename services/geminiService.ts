import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CreditCardTransaction, ParsedTransaction, TransactionType } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getFinancialAnalysis = async (
  transactions: Transaction[],
  creditCardTransactions: CreditCardTransaction[],
  prompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "A chave da API do Gemini não foi configurada. Por favor, configure a variável de ambiente API_KEY.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const transactionData = transactions.map(t => ({
      tipo: t.type,
      descricao: t.description,
      valor: t.amount,
      data: t.date,
      categoria: t.category,
      centro_de_custo: t.costCenter,
    }));
    
    const creditCardData = creditCardTransactions.map(t => ({
      descricao: t.description,
      valor: t.amount,
      data: t.date,
      categoria: t.category,
    }));
    
    const fullPrompt = `
      Você é um assistente financeiro especialista. Analise os seguintes dados de transações financeiras em formato JSON e responda à pergunta do usuário.
      Seja claro, conciso e forneça insights úteis. Use formatação Markdown para melhorar a legibilidade.

      **Dados das Transações (Contas):**
      ${JSON.stringify(transactionData, null, 2)}

      **Dados das Transações (Cartão de Crédito):**
      ${JSON.stringify(creditCardData, null, 2)}

      **Pergunta do Usuário:**
      "${prompt}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao tentar analisar seus dados. Por favor, verifique sua chave de API e tente novamente.";
  }
};

export const parseBankStatement = async (statementText: string): Promise<ParsedTransaction[]> => {
  if (!process.env.API_KEY) {
    throw new Error("A chave da API do Gemini não está configurada.");
  }
  
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analise o seguinte texto de um extrato bancário e extraia todas as transações. 
      Para cada transação, identifique a data, a descrição, o valor e o tipo ('Entrada' ou 'Saída').
      Valores de crédito, pix recebido ou depósitos são 'Entrada'.
      Valores de débito, pix enviado, pagamentos ou compras são 'Saída'.
      Ignore linhas que não são transações, como saldos ou cabeçalhos.
      A data deve estar no formato AAAA-MM-DD.

      Texto do extrato:
      ---
      ${statementText}
      ---
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: 'Data da transação no formato AAAA-MM-DD.' },
              description: { type: Type.STRING, description: 'Descrição da transação.' },
              amount: { type: Type.NUMBER, description: 'Valor da transação, sempre como um número positivo.' },
              type: { type: Type.STRING, enum: [TransactionType.ENTRADA, TransactionType.SAIDA], description: 'O tipo da transação.' },
            },
            required: ['date', 'description', 'amount', 'type'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Validate that the response is an array
    if (!Array.isArray(parsedData)) {
      throw new Error("A API não retornou uma lista de transações válida.");
    }
    
    return parsedData as ParsedTransaction[];

  } catch (error) {
    console.error("Error parsing bank statement with Gemini API:", error);
    throw new Error("Não foi possível analisar o extrato. Verifique o texto e tente novamente.");
  }
};
