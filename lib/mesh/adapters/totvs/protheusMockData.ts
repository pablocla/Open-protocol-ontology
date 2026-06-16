import { ProtheusSx2Row, ProtheusSx3Row, ProtheusSx9Row } from './protheusTypes';

/**
 * Mock del diccionario SX de TOTVS Protheus.
 * Datos representativos del módulo comercial/faturamento (SA*, SC*, SF*, SB*).
 */
export const MOCK_SX2_TABLES: ProtheusSx2Row[] = [
  { X2_CHAVE: 'SA1', X2_ARQUIVO: 'SA1', X2_NOME: 'Cadastro de Clientes', X2_NOMETAB: 'Clientes' },
  { X2_CHAVE: 'SA2', X2_ARQUIVO: 'SA2', X2_NOME: 'Cadastro de Fornecedores', X2_NOMETAB: 'Fornecedores' },
  { X2_CHAVE: 'SB1', X2_ARQUIVO: 'SB1', X2_NOME: 'Cadastro de Produtos', X2_NOMETAB: 'Produtos' },
  { X2_CHAVE: 'SC5', X2_ARQUIVO: 'SC5', X2_NOME: 'Pedidos de Venda', X2_NOMETAB: 'Pedidos Venda' },
  { X2_CHAVE: 'SC6', X2_ARQUIVO: 'SC6', X2_NOME: 'Itens dos Pedidos de Venda', X2_NOMETAB: 'Itens Pedido' },
  { X2_CHAVE: 'SF2', X2_ARQUIVO: 'SF2', X2_NOME: 'Notas Fiscais de Saida', X2_NOMETAB: 'NF Saida' },
];

export const MOCK_SX3_FIELDS: ProtheusSx3Row[] = [
  // SA1 — Clientes
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_NOME', X3_TIPO: 'C', X3_TITULO: 'Nome do Cliente', X3_TAMANHO: 40, X3_OBRIGAT: 'S', X3_ORDEM: '03' },
  { X3_ARQUIVO: 'SA1', X3_CAMPO: 'A1_CGC', X3_TIPO: 'C', X3_TITULO: 'CNPJ/CPF', X3_TAMANHO: 14, X3_OBRIGAT: 'N', X3_ORDEM: '04' },
  // SA2 — Fornecedores
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Fornecedor', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Fornecedor', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SA2', X3_CAMPO: 'A2_NOME', X3_TIPO: 'C', X3_TITULO: 'Nome do Fornecedor', X3_TAMANHO: 40, X3_OBRIGAT: 'S', X3_ORDEM: '03' },
  // SB1 — Produtos
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_COD', X3_TIPO: 'C', X3_TITULO: 'Codigo do Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SB1', X3_CAMPO: 'B1_DESC', X3_TIPO: 'C', X3_TITULO: 'Descricao do Produto', X3_TAMANHO: 60, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  // SC5 — Pedidos de Venda
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_CLIENTE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '02', X3_F3: 'SA1', X3_RELACAO: 'SA1' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_LOJACLI', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA1' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_EMISSAO', X3_TIPO: 'D', X3_TITULO: 'Data de Emissao', X3_OBRIGAT: 'S', X3_ORDEM: '04' },
  { X3_ARQUIVO: 'SC5', X3_CAMPO: 'C5_TOTAL', X3_TIPO: 'N', X3_TITULO: 'Valor Total', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
  // SC6 — Itens do Pedido
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_NUM', X3_TIPO: 'C', X3_TITULO: 'Numero do Pedido', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '01', X3_F3: 'SC5' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_ITEM', X3_TIPO: 'C', X3_TITULO: 'Item do Pedido', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_PRODUTO', X3_TIPO: 'C', X3_TITULO: 'Codigo do Produto', X3_TAMANHO: 15, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SB1', X3_RELACAO: 'SB1' },
  { X3_ARQUIVO: 'SC6', X3_CAMPO: 'C6_QTDVEN', X3_TIPO: 'N', X3_TITULO: 'Quantidade Vendida', X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: 'S', X3_ORDEM: '04' },
  // SF2 — NF Saida
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_DOC', X3_TIPO: 'C', X3_TITULO: 'Numero da NF', X3_TAMANHO: 9, X3_OBRIGAT: 'S', X3_ORDEM: '01' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_SERIE', X3_TIPO: 'C', X3_TITULO: 'Serie da NF', X3_TAMANHO: 3, X3_OBRIGAT: 'S', X3_ORDEM: '02' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_CLIENTE', X3_TIPO: 'C', X3_TITULO: 'Codigo do Cliente', X3_TAMANHO: 6, X3_OBRIGAT: 'S', X3_ORDEM: '03', X3_F3: 'SA1', X3_RELACAO: 'SA1' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_LOJA', X3_TIPO: 'C', X3_TITULO: 'Loja do Cliente', X3_TAMANHO: 2, X3_OBRIGAT: 'S', X3_ORDEM: '04', X3_F3: 'SA1' },
  { X3_ARQUIVO: 'SF2', X3_CAMPO: 'F2_VALBRUT', X3_TIPO: 'N', X3_TITULO: 'Valor Bruto', X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: 'N', X3_ORDEM: '05' },
];

/**
 * Mock de SX9 — DER oficial entre tablas Protheus.
 * Ejemplo principal: SC5.C5_CLIENTE → SA1.A1_COD
 */
export const MOCK_SX9_RELATIONSHIPS: ProtheusSx9Row[] = [
  {
    X9_DOM: 'SC5',
    X9_CDOM: 'C5_CLIENTE',
    X9_LIGDOM: 'SA1',
    X9_LIGCDOM: 'A1_COD',
    X9_IDENT: '001',
    X9_EXPDOM: 'SC5',
    X9_EXPCDOM: 'C5_CLIENTE',
    X9_ENABLE: 'S',
    X9_PROPRI: '1',
  },
  {
    X9_DOM: 'SC5',
    X9_CDOM: 'C5_LOJACLI',
    X9_LIGDOM: 'SA1',
    X9_LIGCDOM: 'A1_LOJA',
    X9_IDENT: '002',
    X9_EXPDOM: 'SC5',
    X9_EXPCDOM: 'C5_LOJACLI',
    X9_ENABLE: 'S',
    X9_PROPRI: '2',
  },
  {
    X9_DOM: 'SC6',
    X9_CDOM: 'C6_NUM',
    X9_LIGDOM: 'SC5',
    X9_LIGCDOM: 'C5_NUM',
    X9_IDENT: '001',
    X9_ENABLE: 'S',
    X9_PROPRI: '1',
  },
  {
    X9_DOM: 'SC6',
    X9_CDOM: 'C6_PRODUTO',
    X9_LIGDOM: 'SB1',
    X9_LIGCDOM: 'B1_COD',
    X9_IDENT: '002',
    X9_ENABLE: 'S',
    X9_PROPRI: '1',
  },
  {
    X9_DOM: 'SF2',
    X9_CDOM: 'F2_CLIENTE',
    X9_LIGDOM: 'SA1',
    X9_LIGCDOM: 'A1_COD',
    X9_IDENT: '001',
    X9_ENABLE: 'S',
    X9_PROPRI: '1',
  },
  {
    X9_DOM: 'SF2',
    X9_CDOM: 'F2_LOJA',
    X9_LIGDOM: 'SA1',
    X9_LIGCDOM: 'A1_LOJA',
    X9_IDENT: '002',
    X9_ENABLE: 'S',
    X9_PROPRI: '2',
  },
  {
    X9_DOM: 'SC5',
    X9_CDOM: 'C5_NUM',
    X9_LIGDOM: 'SF2',
    X9_LIGCDOM: 'F2_DOC',
    X9_IDENT: '003',
    X9_ENABLE: 'N',
    X9_CONDSQL: "F2_SERIE = SC5->C5_SERIE",
    X9_PROPRI: '3',
  },
];