import { ProtheusSx2Row, ProtheusSx3Row, ProtheusSx9Row } from './protheusTypes';

/**
 * Ontología baseline TOTVS Protheus — conocimiento público consolidado.
 * Fuentes: documentación OPO, registry/totvs-protheus, diccionarios SX estándar v12.
 * El auto-discovery incremental solo agrega tablas/campos que NO estén aquí.
 */
export const PROTHEUS_BASELINE_VERSION = '1.0.0';

export const BASELINE_SX2: ProtheusSx2Row[] = [
  { X2_CHAVE: 'SA1', X2_ARQUIVO: 'SA1', X2_NOME: 'Cadastro de Clientes', X2_NOMETAB: 'Clientes' },
  { X2_CHAVE: 'SA2', X2_ARQUIVO: 'SA2', X2_NOME: 'Cadastro de Fornecedores', X2_NOMETAB: 'Fornecedores' },
  { X2_CHAVE: 'SB1', X2_ARQUIVO: 'SB1', X2_NOME: 'Cadastro de Produtos', X2_NOMETAB: 'Produtos' },
  { X2_CHAVE: 'SC5', X2_ARQUIVO: 'SC5', X2_NOME: 'Pedidos de Venda', X2_NOMETAB: 'Pedidos Venda' },
  { X2_CHAVE: 'SC6', X2_ARQUIVO: 'SC6', X2_NOME: 'Itens dos Pedidos de Venda', X2_NOMETAB: 'Itens Pedido' },
  { X2_CHAVE: 'SC7', X2_ARQUIVO: 'SC7', X2_NOME: 'Pedidos de Compra', X2_NOMETAB: 'Pedidos Compra' },
  { X2_CHAVE: 'SC9', X2_ARQUIVO: 'SC9', X2_NOME: 'Liberacoes de Pedidos de Venda', X2_NOMETAB: 'Liberacoes' },
  { X2_CHAVE: 'SF1', X2_ARQUIVO: 'SF1', X2_NOME: 'Notas Fiscais de Entrada', X2_NOMETAB: 'NF Entrada' },
  { X2_CHAVE: 'SF2', X2_ARQUIVO: 'SF2', X2_NOME: 'Notas Fiscais de Saida', X2_NOMETAB: 'NF Saida' },
  { X2_CHAVE: 'SF3', X2_ARQUIVO: 'SF3', X2_NOME: 'Livros Fiscais', X2_NOMETAB: 'Livros Fiscais' },
  { X2_CHAVE: 'SD1', X2_ARQUIVO: 'SD1', X2_NOME: 'Itens NF Entrada', X2_NOMETAB: 'Itens NF Entrada' },
  { X2_CHAVE: 'SD2', X2_ARQUIVO: 'SD2', X2_NOME: 'Itens NF Saida', X2_NOMETAB: 'Itens NF Saida' },
  { X2_CHAVE: 'SE1', X2_ARQUIVO: 'SE1', X2_NOME: 'Titulos a Receber', X2_NOMETAB: 'Contas a Receber' },
  { X2_CHAVE: 'SE2', X2_ARQUIVO: 'SE2', X2_NOME: 'Titulos a Pagar', X2_NOMETAB: 'Contas a Pagar' },
];

export const BASELINE_SX3: ProtheusSx3Row[] = [
  // SA1
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_NOME', X3_TIPO: 'C', X3_TITULO: 'Nome do Cliente', X3_TAMANHO: 40, X3_OBRIGAT: 'S', X3_ORDEM: '03' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_NREDUZ', X3_TIPO: 'C', X3_TITULO: 'Nome Reduzido', X3_TAMANHO: 20, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_CGC', X3_TIPO: 'C', X3_TITULO: 'CNPJ/CPF', X3_TAMANHO: 14, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_SALDUP', X3_TIPO: 'N', X3_TITULO: 'Saldo Devedor', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '06' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_LC', X3_TIPO: 'N', X3_TITULO: 'Limite de Credito', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '07' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_MSBLQL', X3_TIPO: 'C', X3_TITULO: 'Bloqueado', X3_TAMANHO: 1, X3_OBRIGAT: 'N', X3_ORDEM: '08' },
  // SA2
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Fornecedor', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_NOME', X3_TIPO: 'C', X3_TITULO: 'Nome do Fornecedor', X3_TAMANHO: 40, X3_OBRIGAT: 'S', X3_ORDEM: '03' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_CGC', X3_TIPO: 'C', X3_TITULO: 'CNPJ/CPF', X3_TAMANHO: 14, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_SALDUP', X3_TIPO: 'N', X3_TITULO: 'Saldo Devedor', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
  // SB1
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_DESC', X3_TIPO: 'C', X3_TITULO: 'Descricao do Produto', X3_TAMANHO: 60, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_TIPO', X3_TIPO: 'C', X3_TITULO: 'Tipo do Produto', X3_TAMANHO: 2, X3_OBRIGAT: 'N', X3_ORDEM: '03' },
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_UM', X3_TIPO: 'C', X3_TITULO: 'Unidade de Medida', X3_TAMANHO: 2, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
  // SC5
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_CLIENTE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '02', X3_F3: 'SA1', X3_RELACAO: 'SA1' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_LOJACLI', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA1' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_EMISSAO', X3_TIPO: 'D', X3_TITULO: 'Data de Emissao', X3_OBRIGAT: 'S', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_TOTAL', X3_TIPO: 'N', X3_TITULO: 'Valor Total', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_CONDPAG', X3_TIPO: 'C', X3_TITULO: 'Condicao de Pagamento', X3_TAMANHO: 3, X3_OBRIGAT: 'N', X3_ORDEM: '06' },
  // SC6
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01', X3_F3: 'SC5' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_ITEM', X3_TIPO: 'C', X3_TITULO: 'Item do Pedido', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_PRODUTO', X3_TIPO: 'C', X3_TITULO: 'Codigo do Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SB1', X3_RELACAO: 'SB1' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_QTDVEN', X3_TIPO: 'N', X3_TITULO: 'Quantidade Vendida', X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: 'S', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_PRCVEN', X3_TIPO: 'N', X3_TITULO: 'Preco de Venda', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
  // SC7
  { X3_ARQUIVO: 'SC7', X3_CAMPO: 'C7_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido Compra', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SC7', X3_CAMPO: 'C7_FORNECE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '02', X3_F3: 'SA2', X3_RELACAO: 'SA2' },
  { X3_ARQUIVO: 'SC7', X3_CAMPO: 'C7_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Fornecedor', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA2' },
  // SC9
  { X3_ARQUIVO: 'SC9', X3_CAMPO: 'C9_PEDIDO', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01', X3_F3: 'SC5' },
  { X3_ARQUIVO: 'SC9', X3_CAMPO: 'C9_ITEM', X3_TIPO: 'C', X3_TITULO: 'Item do Pedido', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SC9', X3_CAMPO: 'C9_QTDLIB', X3_TIPO: 'N', X3_TITULO: 'Quantidade Liberada', X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '03' },
  // SF1
  { X3_ARQUIVO: 'SF1', X3_CAMPO: 'F1_DOC', X3_TIPO: 'C', X3_TITULO: 'Numero da NF Entrada', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SF1', X3_CAMPO: 'F1_FORNECE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '02', X3_F3: 'SA2', X3_RELACAO: 'SA2' },
  { X3_ARQUIVO: 'SF1', X3_CAMPO: 'F1_VALBRUT', X3_TIPO: 'N', X3_TITULO: 'Valor Bruto', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '03' },
  // SF2
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_DOC', X3_TIPO: 'C', X3_TITULO: 'Numero da NF', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_SERIE', X3_TIPO: 'C', X3_TITULO: 'Serie da NF', X3_TAMANHO: 3, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_CLIENTE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA1', X3_RELACAO: 'SA1' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '04', X3_F3: 'SA1' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_EMISSAO', X3_TIPO: 'D', X3_TITULO: 'Data de Emissao', X3_OBRIGAT: 'S', X3_ORDEM: '05' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_VALBRUT', X3_TIPO: 'N', X3_TITULO: 'Valor Bruto', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '06' },
  // SF3
  { X3_ARQUIVO: 'SF3', X3_CAMPO: 'F3_NFISCAL', X3_TIPO: 'C', X3_TITULO: 'Numero NF Fiscal', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SF3', X3_CAMPO: 'F3_SERIE', X3_TIPO: 'C', X3_TITULO: 'Serie NF', X3_TAMANHO: 3, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SF3', X3_CAMPO: 'F3_CLIEFOR', X3_TIPO: 'C', X3_TITULO: 'Cliente/Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '03' },
  // SD1 / SD2
  { X3_ARQUIVO: 'SD1', X3_CAMPO: 'D1_DOC', X3_TIPO: 'C', X3_TITULO: 'Documento NF Entrada', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01', X3_F3: 'SF1' },
  { X3_ARQUIVO: 'SD1', X3_CAMPO: 'D1_ITEM', X3_TIPO: 'C', X3_TITULO: 'Item NF Entrada', X3_TAMANHO: 4, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SD1', X3_CAMPO: 'D1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SB1' },
  { X3_ARQUIVO: 'SD2', X3_CAMPO: 'D2_DOC', X3_TIPO: 'C', X3_TITULO: 'Documento NF Saida', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01', X3_F3: 'SF2' },
  { X3_ARQUIVO: 'SD2', X3_CAMPO: 'D2_ITEM', X3_TIPO: 'C', X3_TITULO: 'Item NF Saida', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SD2', X3_CAMPO: 'D2_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SB1' },
  // SE1 / SE2
  { X3_ARQUIVO: 'SE1', X3_CAMPO: 'E1_PREFIXO', X3_TIPO: 'C', X3_TITULO: 'Prefixo Titulo', X3_TAMANHO: 3, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SE1', X3_CAMPO: 'E1_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero Titulo', X3_TAMANHO: 8, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SE1', X3_CAMPO: 'E1_CLIENTE', X3_TIPO: 'C', X3_TITULO: 'Codigo Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA1', X3_RELACAO: 'SA1' },
  { X3_ARQUIVO: 'SE1', X3_CAMPO: 'E1_VALOR', X3_TIPO: 'N', X3_TITULO: 'Valor Titulo', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SE2', X3_CAMPO: 'E2_PREFIXO', X3_TIPO: 'C', X3_TITULO: 'Prefixo Titulo', X3_TAMANHO: 3, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SE2', X3_CAMPO: 'E2_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero Titulo', X3_TAMANHO: 8, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SE2', X3_CAMPO: 'E2_FORNECE', X3_TIPO: 'C', X3_TITULO: 'Codigo Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA2', X3_RELACAO: 'SA2' },
  { X3_ARQUIVO: 'SE2', X3_CAMPO: 'E2_VALOR', X3_TIPO: 'N', X3_TITULO: 'Valor Titulo', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
];

export const BASELINE_SX9: ProtheusSx9Row[] = [
  { X9_DOM: 'SC5', X9_CDOM: 'C5_CLIENTE', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SC5', X9_CDOM: 'C5_LOJACLI', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_LOJA', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SC6', X9_CDOM: 'C6_NUM', X9_LIGDOM: 'SC5', X9_LIGCDOM: 'C5_NUM', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SC6', X9_CDOM: 'C6_PRODUTO', X9_LIGDOM: 'SB1', X9_LIGCDOM: 'B1_COD', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SC7', X9_CDOM: 'C7_FORNECE', X9_LIGDOM: 'SA2', X9_LIGCDOM: 'A2_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SC7', X9_CDOM: 'C7_LOJA', X9_LIGDOM: 'SA2', X9_LIGCDOM: 'A2_LOJA', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SC9', X9_CDOM: 'C9_PEDIDO', X9_LIGDOM: 'SC5', X9_LIGCDOM: 'C5_NUM', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SF1', X9_CDOM: 'F1_FORNECE', X9_LIGDOM: 'SA2', X9_LIGCDOM: 'A2_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SF2', X9_CDOM: 'F2_CLIENTE', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SF2', X9_CDOM: 'F2_LOJA', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_LOJA', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SD1', X9_CDOM: 'D1_DOC', X9_LIGDOM: 'SF1', X9_LIGCDOM: 'F1_DOC', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SD1', X9_CDOM: 'D1_COD', X9_LIGDOM: 'SB1', X9_LIGCDOM: 'B1_COD', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SD2', X9_CDOM: 'D2_DOC', X9_LIGDOM: 'SF2', X9_LIGCDOM: 'F2_DOC', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SD2', X9_CDOM: 'D2_COD', X9_LIGDOM: 'SB1', X9_LIGCDOM: 'B1_COD', X9_IDENT: '002', X9_ENABLE: 'S' },
  { X9_DOM: 'SE1', X9_CDOM: 'E1_CLIENTE', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
  { X9_DOM: 'SE2', X9_CDOM: 'E2_FORNECE', X9_LIGDOM: 'SA2', X9_LIGCDOM: 'A2_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
];

/** Mapeos semánticos OPO canónicos (conocimiento público del adapter) */
export const BASELINE_SEMANTIC_MAPPINGS: Record<string, Record<string, string>> = {
  Customer: {
    id: 'A1_COD + A1_LOJA',
    partyId: 'A1_CGC',
    tradeName: 'A1_NREDUZ',
    legalName: 'A1_NOME',
    outstandingBalance: 'A1_SALDUP',
    creditLimit: 'A1_LC',
    active: "A1_MSBLQL != '1'",
  },
  Supplier: {
    id: 'A2_COD + A2_LOJA',
    partyId: 'A2_CGC',
    legalName: 'A2_NOME',
    outstandingBalance: 'A2_SALDUP',
  },
  Product: {
    id: 'B1_COD',
    description: 'B1_DESC',
    productType: 'B1_TIPO',
    unitOfMeasure: 'B1_UM',
  },
  SalesOrderHeader: {
    id: 'C5_NUM',
    customerId: 'C5_CLIENTE',
    customerBranch: 'C5_LOJACLI',
    issueDate: 'C5_EMISSAO',
    totalAmount: 'C5_TOTAL',
    paymentTerms: 'C5_CONDPAG',
  },
  SalesOrderItem: {
    orderId: 'C6_NUM',
    lineNumber: 'C6_ITEM',
    productId: 'C6_PRODUTO',
    quantity: 'C6_QTDVEN',
    unitPrice: 'C6_PRCVEN',
  },
  SalesInvoiceHeader: {
    id: 'F2_DOC + F2_SERIE',
    number: 'F2_DOC',
    customerId: 'F2_CLIENTE',
    issueDate: 'F2_EMISSAO',
    grandTotal: 'F2_VALBRUT',
  },
  PurchaseInvoiceHeader: {
    id: 'F1_DOC',
    supplierId: 'F1_FORNECE',
    grandTotal: 'F1_VALBRUT',
  },
};

/** Simula campos/tablas custom que existen en la BD del cliente pero no en el baseline */
export const MOCK_LIVE_DELTA_SX2: ProtheusSx2Row[] = [
  { X2_CHAVE: 'ZZ1', X2_ARQUIVO: 'ZZ1', X2_NOME: 'Tabela Custom CRM', X2_NOMETAB: 'CRM Custom' },
];

export const MOCK_LIVE_DELTA_SX3: ProtheusSx3Row[] = [
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_XOPOCRM', X3_TIPO: 'C', X3_TITULO: 'ID CRM Custom', X3_TAMANHO: 20, X3_OBRIGAT: 'N', X3_ORDEM: '99' },
  { X3_ARQUIVO: 'ZZ1', X3_CAMPO: 'ZZ1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo CRM', X3_TAMANHO: 10, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'ZZ1', X3_CAMPO: 'ZZ1_DESC', X3_TIPO: 'C', X3_TITULO: 'Descricao CRM', X3_TAMANHO: 50, X3_OBRIGAT: 'N', X3_ORDEM: '02' },
];

export const MOCK_LIVE_DELTA_SX9: ProtheusSx9Row[] = [
  { X9_DOM: 'ZZ1', X9_CDOM: 'ZZ1_COD', X9_LIGDOM: 'SA1', X9_LIGCDOM: 'A1_COD', X9_IDENT: '001', X9_ENABLE: 'S' },
];