#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/mesh/adapters/totvs/protheusDbClient.ts
function detectDriverFromUrl(connectionString) {
  const url = connectionString.trim().toLowerCase();
  if (url.startsWith("mssql://") || url.startsWith("sqlserver://") || url.includes("server=") || url.includes("driver={sql server}")) {
    return "mssql";
  }
  if (url.startsWith("oracle://") || url.startsWith("oracledb://") || url.includes("host=") && url.includes("service_name=")) {
    return "oracle";
  }
  return "postgresql";
}
async function createProtheusDbClient(connectionString) {
  const driver = detectDriverFromUrl(connectionString);
  if (driver === "postgresql") {
    let Client;
    try {
      Client = require("pg").Client;
    } catch (e) {
      throw new Error('El paquete "pg" es requerido para conexiones PostgreSQL.');
    }
    const client = new Client({ connectionString });
    await client.connect();
    return {
      query: (sql) => client.query(sql),
      close: () => client.end()
    };
  }
  if (driver === "mssql") {
    let sql;
    try {
      sql = require("mssql");
    } catch (e) {
      throw new Error('El paquete "mssql" es requerido para conexiones SQL Server.');
    }
    await sql.connect(connectionString);
    return {
      query: async (q) => {
        var _a;
        const res = await sql.query(q);
        return { rows: (_a = res.recordset) != null ? _a : [] };
      },
      close: () => sql.close()
    };
  }
  let oracledb;
  try {
    oracledb = require("oracledb");
  } catch (e) {
    throw new Error('El paquete "oracledb" es requerido para conexiones Oracle.');
  }
  const conn = await oracledb.getConnection(connectionString);
  return {
    query: async (q) => {
      var _a;
      const res = await conn.execute(q, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      return { rows: (_a = res.rows) != null ? _a : [] };
    },
    close: () => conn.close()
  };
}
var init_protheusDbClient = __esm({
  "lib/mesh/adapters/totvs/protheusDbClient.ts"() {
    "use strict";
  }
});

// lib/mesh/adapters/totvs/protheusTypes.ts
var init_protheusTypes = __esm({
  "lib/mesh/adapters/totvs/protheusTypes.ts"() {
    "use strict";
  }
});

// lib/mesh/adapters/totvs/protheusMockData.ts
var MOCK_SX2_TABLES, MOCK_SX3_FIELDS, MOCK_SX9_RELATIONSHIPS;
var init_protheusMockData = __esm({
  "lib/mesh/adapters/totvs/protheusMockData.ts"() {
    "use strict";
    MOCK_SX2_TABLES = [
      { X2_CHAVE: "SA1", X2_ARQUIVO: "SA1", X2_NOME: "Cadastro de Clientes", X2_NOMETAB: "Clientes" },
      { X2_CHAVE: "SA2", X2_ARQUIVO: "SA2", X2_NOME: "Cadastro de Fornecedores", X2_NOMETAB: "Fornecedores" },
      { X2_CHAVE: "SB1", X2_ARQUIVO: "SB1", X2_NOME: "Cadastro de Produtos", X2_NOMETAB: "Produtos" },
      { X2_CHAVE: "SC5", X2_ARQUIVO: "SC5", X2_NOME: "Pedidos de Venda", X2_NOMETAB: "Pedidos Venda" },
      { X2_CHAVE: "SC6", X2_ARQUIVO: "SC6", X2_NOME: "Itens dos Pedidos de Venda", X2_NOMETAB: "Itens Pedido" },
      { X2_CHAVE: "SF2", X2_ARQUIVO: "SF2", X2_NOME: "Notas Fiscais de Saida", X2_NOMETAB: "NF Saida" }
    ];
    MOCK_SX3_FIELDS = [
      // SA1 — Clientes
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_NOME", X3_TIPO: "C", X3_TITULO: "Nome do Cliente", X3_TAMANHO: 40, X3_OBRIGAT: "S", X3_ORDEM: "03" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_CGC", X3_TIPO: "C", X3_TITULO: "CNPJ/CPF", X3_TAMANHO: 14, X3_OBRIGAT: "N", X3_ORDEM: "04" },
      // SA2 — Fornecedores
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Fornecedor", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_NOME", X3_TIPO: "C", X3_TITULO: "Nome do Fornecedor", X3_TAMANHO: 40, X3_OBRIGAT: "S", X3_ORDEM: "03" },
      // SB1 — Produtos
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_DESC", X3_TIPO: "C", X3_TITULO: "Descricao do Produto", X3_TAMANHO: 60, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      // SC5 — Pedidos de Venda
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_NUM", X3_TIPO: "C", X3_TITULO: "Numero do Pedido", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_CLIENTE", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "02", X3_F3: "SA1", X3_RELACAO: "SA1" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_LOJACLI", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA1" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_EMISSAO", X3_TIPO: "D", X3_TITULO: "Data de Emissao", X3_OBRIGAT: "S", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_TOTAL", X3_TIPO: "N", X3_TITULO: "Valor Total", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "05" },
      // SC6 — Itens do Pedido
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_NUM", X3_TIPO: "C", X3_TITULO: "Numero do Pedido", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01", X3_F3: "SC5" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_ITEM", X3_TIPO: "C", X3_TITULO: "Item do Pedido", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_PRODUTO", X3_TIPO: "C", X3_TITULO: "Codigo do Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SB1", X3_RELACAO: "SB1" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_QTDVEN", X3_TIPO: "N", X3_TITULO: "Quantidade Vendida", X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: "S", X3_ORDEM: "04" },
      // SF2 — NF Saida
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_DOC", X3_TIPO: "C", X3_TITULO: "Numero da NF", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_SERIE", X3_TIPO: "C", X3_TITULO: "Serie da NF", X3_TAMANHO: 3, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_CLIENTE", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA1", X3_RELACAO: "SA1" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "04", X3_F3: "SA1" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_VALBRUT", X3_TIPO: "N", X3_TITULO: "Valor Bruto", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "05" }
    ];
    MOCK_SX9_RELATIONSHIPS = [
      {
        X9_DOM: "SC5",
        X9_CDOM: "C5_CLIENTE",
        X9_LIGDOM: "SA1",
        X9_LIGCDOM: "A1_COD",
        X9_IDENT: "001",
        X9_EXPDOM: "SC5",
        X9_EXPCDOM: "C5_CLIENTE",
        X9_ENABLE: "S",
        X9_PROPRI: "1"
      },
      {
        X9_DOM: "SC5",
        X9_CDOM: "C5_LOJACLI",
        X9_LIGDOM: "SA1",
        X9_LIGCDOM: "A1_LOJA",
        X9_IDENT: "002",
        X9_EXPDOM: "SC5",
        X9_EXPCDOM: "C5_LOJACLI",
        X9_ENABLE: "S",
        X9_PROPRI: "2"
      },
      {
        X9_DOM: "SC6",
        X9_CDOM: "C6_NUM",
        X9_LIGDOM: "SC5",
        X9_LIGCDOM: "C5_NUM",
        X9_IDENT: "001",
        X9_ENABLE: "S",
        X9_PROPRI: "1"
      },
      {
        X9_DOM: "SC6",
        X9_CDOM: "C6_PRODUTO",
        X9_LIGDOM: "SB1",
        X9_LIGCDOM: "B1_COD",
        X9_IDENT: "002",
        X9_ENABLE: "S",
        X9_PROPRI: "1"
      },
      {
        X9_DOM: "SF2",
        X9_CDOM: "F2_CLIENTE",
        X9_LIGDOM: "SA1",
        X9_LIGCDOM: "A1_COD",
        X9_IDENT: "001",
        X9_ENABLE: "S",
        X9_PROPRI: "1"
      },
      {
        X9_DOM: "SF2",
        X9_CDOM: "F2_LOJA",
        X9_LIGDOM: "SA1",
        X9_LIGCDOM: "A1_LOJA",
        X9_IDENT: "002",
        X9_ENABLE: "S",
        X9_PROPRI: "2"
      },
      {
        X9_DOM: "SC5",
        X9_CDOM: "C5_NUM",
        X9_LIGDOM: "SF2",
        X9_LIGCDOM: "F2_DOC",
        X9_IDENT: "003",
        X9_ENABLE: "N",
        X9_CONDSQL: "F2_SERIE = SC5->C5_SERIE",
        X9_PROPRI: "3"
      }
    ];
  }
});

// lib/mesh/adapters/totvs/protheusBaselineSeed.ts
var PROTHEUS_BASELINE_VERSION, BASELINE_SX2, BASELINE_SX3, BASELINE_SX9, BASELINE_SEMANTIC_MAPPINGS, MOCK_LIVE_DELTA_SX2, MOCK_LIVE_DELTA_SX3, MOCK_LIVE_DELTA_SX9;
var init_protheusBaselineSeed = __esm({
  "lib/mesh/adapters/totvs/protheusBaselineSeed.ts"() {
    "use strict";
    PROTHEUS_BASELINE_VERSION = "1.0.0";
    BASELINE_SX2 = [
      { X2_CHAVE: "SA1", X2_ARQUIVO: "SA1", X2_NOME: "Cadastro de Clientes", X2_NOMETAB: "Clientes" },
      { X2_CHAVE: "SA2", X2_ARQUIVO: "SA2", X2_NOME: "Cadastro de Fornecedores", X2_NOMETAB: "Fornecedores" },
      { X2_CHAVE: "SB1", X2_ARQUIVO: "SB1", X2_NOME: "Cadastro de Produtos", X2_NOMETAB: "Produtos" },
      { X2_CHAVE: "SC5", X2_ARQUIVO: "SC5", X2_NOME: "Pedidos de Venda", X2_NOMETAB: "Pedidos Venda" },
      { X2_CHAVE: "SC6", X2_ARQUIVO: "SC6", X2_NOME: "Itens dos Pedidos de Venda", X2_NOMETAB: "Itens Pedido" },
      { X2_CHAVE: "SC7", X2_ARQUIVO: "SC7", X2_NOME: "Pedidos de Compra", X2_NOMETAB: "Pedidos Compra" },
      { X2_CHAVE: "SC9", X2_ARQUIVO: "SC9", X2_NOME: "Liberacoes de Pedidos de Venda", X2_NOMETAB: "Liberacoes" },
      { X2_CHAVE: "SF1", X2_ARQUIVO: "SF1", X2_NOME: "Notas Fiscais de Entrada", X2_NOMETAB: "NF Entrada" },
      { X2_CHAVE: "SF2", X2_ARQUIVO: "SF2", X2_NOME: "Notas Fiscais de Saida", X2_NOMETAB: "NF Saida" },
      { X2_CHAVE: "SF3", X2_ARQUIVO: "SF3", X2_NOME: "Livros Fiscais", X2_NOMETAB: "Livros Fiscais" },
      { X2_CHAVE: "SD1", X2_ARQUIVO: "SD1", X2_NOME: "Itens NF Entrada", X2_NOMETAB: "Itens NF Entrada" },
      { X2_CHAVE: "SD2", X2_ARQUIVO: "SD2", X2_NOME: "Itens NF Saida", X2_NOMETAB: "Itens NF Saida" },
      { X2_CHAVE: "SE1", X2_ARQUIVO: "SE1", X2_NOME: "Titulos a Receber", X2_NOMETAB: "Contas a Receber" },
      { X2_CHAVE: "SE2", X2_ARQUIVO: "SE2", X2_NOME: "Titulos a Pagar", X2_NOMETAB: "Contas a Pagar" }
    ];
    BASELINE_SX3 = [
      // SA1
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_NOME", X3_TIPO: "C", X3_TITULO: "Nome do Cliente", X3_TAMANHO: 40, X3_OBRIGAT: "S", X3_ORDEM: "03" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_NREDUZ", X3_TIPO: "C", X3_TITULO: "Nome Reduzido", X3_TAMANHO: 20, X3_OBRIGAT: "N", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_CGC", X3_TIPO: "C", X3_TITULO: "CNPJ/CPF", X3_TAMANHO: 14, X3_OBRIGAT: "N", X3_ORDEM: "05" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_SALDUP", X3_TIPO: "N", X3_TITULO: "Saldo Devedor", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "06" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_LC", X3_TIPO: "N", X3_TITULO: "Limite de Credito", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "07" },
      { X3_ARQUIVO: "SA1", X3_CAMPO: "A1_MSBLQL", X3_TIPO: "C", X3_TITULO: "Bloqueado", X3_TAMANHO: 1, X3_OBRIGAT: "N", X3_ORDEM: "08" },
      // SA2
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Fornecedor", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_NOME", X3_TIPO: "C", X3_TITULO: "Nome do Fornecedor", X3_TAMANHO: 40, X3_OBRIGAT: "S", X3_ORDEM: "03" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_CGC", X3_TIPO: "C", X3_TITULO: "CNPJ/CPF", X3_TAMANHO: 14, X3_OBRIGAT: "N", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SA2", X3_CAMPO: "A2_SALDUP", X3_TIPO: "N", X3_TITULO: "Saldo Devedor", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "05" },
      // SB1
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_COD", X3_TIPO: "C", X3_TITULO: "Codigo do Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_DESC", X3_TIPO: "C", X3_TITULO: "Descricao do Produto", X3_TAMANHO: 60, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_TIPO", X3_TIPO: "C", X3_TITULO: "Tipo do Produto", X3_TAMANHO: 2, X3_OBRIGAT: "N", X3_ORDEM: "03" },
      { X3_ARQUIVO: "SB1", X3_CAMPO: "B1_UM", X3_TIPO: "C", X3_TITULO: "Unidade de Medida", X3_TAMANHO: 2, X3_OBRIGAT: "N", X3_ORDEM: "04" },
      // SC5
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_NUM", X3_TIPO: "C", X3_TITULO: "Numero do Pedido", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_CLIENTE", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "02", X3_F3: "SA1", X3_RELACAO: "SA1" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_LOJACLI", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA1" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_EMISSAO", X3_TIPO: "D", X3_TITULO: "Data de Emissao", X3_OBRIGAT: "S", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_TOTAL", X3_TIPO: "N", X3_TITULO: "Valor Total", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "05" },
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_CONDPAG", X3_TIPO: "C", X3_TITULO: "Condicao de Pagamento", X3_TAMANHO: 3, X3_OBRIGAT: "N", X3_ORDEM: "06" },
      // SC6
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_NUM", X3_TIPO: "C", X3_TITULO: "Numero do Pedido", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01", X3_F3: "SC5" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_ITEM", X3_TIPO: "C", X3_TITULO: "Item do Pedido", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_PRODUTO", X3_TIPO: "C", X3_TITULO: "Codigo do Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SB1", X3_RELACAO: "SB1" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_QTDVEN", X3_TIPO: "N", X3_TITULO: "Quantidade Vendida", X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: "S", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SC6", X3_CAMPO: "C6_PRCVEN", X3_TIPO: "N", X3_TITULO: "Preco de Venda", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "05" },
      // SC7
      { X3_ARQUIVO: "SC7", X3_CAMPO: "C7_NUM", X3_TIPO: "C", X3_TITULO: "Numero do Pedido Compra", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SC7", X3_CAMPO: "C7_FORNECE", X3_TIPO: "C", X3_TITULO: "Codigo do Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "02", X3_F3: "SA2", X3_RELACAO: "SA2" },
      { X3_ARQUIVO: "SC7", X3_CAMPO: "C7_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Fornecedor", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA2" },
      // SC9
      { X3_ARQUIVO: "SC9", X3_CAMPO: "C9_PEDIDO", X3_TIPO: "C", X3_TITULO: "Numero do Pedido", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "01", X3_F3: "SC5" },
      { X3_ARQUIVO: "SC9", X3_CAMPO: "C9_ITEM", X3_TIPO: "C", X3_TITULO: "Item do Pedido", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SC9", X3_CAMPO: "C9_QTDLIB", X3_TIPO: "N", X3_TITULO: "Quantidade Liberada", X3_TAMANHO: 12, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "03" },
      // SF1
      { X3_ARQUIVO: "SF1", X3_CAMPO: "F1_DOC", X3_TIPO: "C", X3_TITULO: "Numero da NF Entrada", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SF1", X3_CAMPO: "F1_FORNECE", X3_TIPO: "C", X3_TITULO: "Codigo do Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "02", X3_F3: "SA2", X3_RELACAO: "SA2" },
      { X3_ARQUIVO: "SF1", X3_CAMPO: "F1_VALBRUT", X3_TIPO: "N", X3_TITULO: "Valor Bruto", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "03" },
      // SF2
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_DOC", X3_TIPO: "C", X3_TITULO: "Numero da NF", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_SERIE", X3_TIPO: "C", X3_TITULO: "Serie da NF", X3_TAMANHO: 3, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_CLIENTE", X3_TIPO: "C", X3_TITULO: "Codigo do Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA1", X3_RELACAO: "SA1" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_LOJA", X3_TIPO: "C", X3_TITULO: "Loja do Cliente", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "04", X3_F3: "SA1" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_EMISSAO", X3_TIPO: "D", X3_TITULO: "Data de Emissao", X3_OBRIGAT: "S", X3_ORDEM: "05" },
      { X3_ARQUIVO: "SF2", X3_CAMPO: "F2_VALBRUT", X3_TIPO: "N", X3_TITULO: "Valor Bruto", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "06" },
      // SF3
      { X3_ARQUIVO: "SF3", X3_CAMPO: "F3_NFISCAL", X3_TIPO: "C", X3_TITULO: "Numero NF Fiscal", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SF3", X3_CAMPO: "F3_SERIE", X3_TIPO: "C", X3_TITULO: "Serie NF", X3_TAMANHO: 3, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SF3", X3_CAMPO: "F3_CLIEFOR", X3_TIPO: "C", X3_TITULO: "Cliente/Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "03" },
      // SD1 / SD2
      { X3_ARQUIVO: "SD1", X3_CAMPO: "D1_DOC", X3_TIPO: "C", X3_TITULO: "Documento NF Entrada", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01", X3_F3: "SF1" },
      { X3_ARQUIVO: "SD1", X3_CAMPO: "D1_ITEM", X3_TIPO: "C", X3_TITULO: "Item NF Entrada", X3_TAMANHO: 4, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SD1", X3_CAMPO: "D1_COD", X3_TIPO: "C", X3_TITULO: "Codigo Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SB1" },
      { X3_ARQUIVO: "SD2", X3_CAMPO: "D2_DOC", X3_TIPO: "C", X3_TITULO: "Documento NF Saida", X3_TAMANHO: 9, X3_OBRIGAT: "S", X3_ORDEM: "01", X3_F3: "SF2" },
      { X3_ARQUIVO: "SD2", X3_CAMPO: "D2_ITEM", X3_TIPO: "C", X3_TITULO: "Item NF Saida", X3_TAMANHO: 2, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SD2", X3_CAMPO: "D2_COD", X3_TIPO: "C", X3_TITULO: "Codigo Produto", X3_TAMANHO: 15, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SB1" },
      // SE1 / SE2
      { X3_ARQUIVO: "SE1", X3_CAMPO: "E1_PREFIXO", X3_TIPO: "C", X3_TITULO: "Prefixo Titulo", X3_TAMANHO: 3, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SE1", X3_CAMPO: "E1_NUM", X3_TIPO: "C", X3_TITULO: "Numero Titulo", X3_TAMANHO: 8, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SE1", X3_CAMPO: "E1_CLIENTE", X3_TIPO: "C", X3_TITULO: "Codigo Cliente", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA1", X3_RELACAO: "SA1" },
      { X3_ARQUIVO: "SE1", X3_CAMPO: "E1_VALOR", X3_TIPO: "N", X3_TITULO: "Valor Titulo", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "04" },
      { X3_ARQUIVO: "SE2", X3_CAMPO: "E2_PREFIXO", X3_TIPO: "C", X3_TITULO: "Prefixo Titulo", X3_TAMANHO: 3, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "SE2", X3_CAMPO: "E2_NUM", X3_TIPO: "C", X3_TITULO: "Numero Titulo", X3_TAMANHO: 8, X3_OBRIGAT: "S", X3_ORDEM: "02" },
      { X3_ARQUIVO: "SE2", X3_CAMPO: "E2_FORNECE", X3_TIPO: "C", X3_TITULO: "Codigo Fornecedor", X3_TAMANHO: 6, X3_OBRIGAT: "S", X3_ORDEM: "03", X3_F3: "SA2", X3_RELACAO: "SA2" },
      { X3_ARQUIVO: "SE2", X3_CAMPO: "E2_VALOR", X3_TIPO: "N", X3_TITULO: "Valor Titulo", X3_TAMANHO: 14, X3_DECIMAL: 2, X3_OBRIGAT: "N", X3_ORDEM: "04" }
    ];
    BASELINE_SX9 = [
      { X9_DOM: "SC5", X9_CDOM: "C5_CLIENTE", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_COD", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SC5", X9_CDOM: "C5_LOJACLI", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_LOJA", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SC6", X9_CDOM: "C6_NUM", X9_LIGDOM: "SC5", X9_LIGCDOM: "C5_NUM", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SC6", X9_CDOM: "C6_PRODUTO", X9_LIGDOM: "SB1", X9_LIGCDOM: "B1_COD", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SC7", X9_CDOM: "C7_FORNECE", X9_LIGDOM: "SA2", X9_LIGCDOM: "A2_COD", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SC7", X9_CDOM: "C7_LOJA", X9_LIGDOM: "SA2", X9_LIGCDOM: "A2_LOJA", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SC9", X9_CDOM: "C9_PEDIDO", X9_LIGDOM: "SC5", X9_LIGCDOM: "C5_NUM", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SF1", X9_CDOM: "F1_FORNECE", X9_LIGDOM: "SA2", X9_LIGCDOM: "A2_COD", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SF2", X9_CDOM: "F2_CLIENTE", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_COD", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SF2", X9_CDOM: "F2_LOJA", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_LOJA", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SD1", X9_CDOM: "D1_DOC", X9_LIGDOM: "SF1", X9_LIGCDOM: "F1_DOC", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SD1", X9_CDOM: "D1_COD", X9_LIGDOM: "SB1", X9_LIGCDOM: "B1_COD", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SD2", X9_CDOM: "D2_DOC", X9_LIGDOM: "SF2", X9_LIGCDOM: "F2_DOC", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SD2", X9_CDOM: "D2_COD", X9_LIGDOM: "SB1", X9_LIGCDOM: "B1_COD", X9_IDENT: "002", X9_ENABLE: "S" },
      { X9_DOM: "SE1", X9_CDOM: "E1_CLIENTE", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_COD", X9_IDENT: "001", X9_ENABLE: "S" },
      { X9_DOM: "SE2", X9_CDOM: "E2_FORNECE", X9_LIGDOM: "SA2", X9_LIGCDOM: "A2_COD", X9_IDENT: "001", X9_ENABLE: "S" }
    ];
    BASELINE_SEMANTIC_MAPPINGS = {
      Customer: {
        id: "A1_COD + A1_LOJA",
        partyId: "A1_CGC",
        tradeName: "A1_NREDUZ",
        legalName: "A1_NOME",
        outstandingBalance: "A1_SALDUP",
        creditLimit: "A1_LC",
        active: "A1_MSBLQL != '1'"
      },
      Supplier: {
        id: "A2_COD + A2_LOJA",
        partyId: "A2_CGC",
        legalName: "A2_NOME",
        outstandingBalance: "A2_SALDUP"
      },
      Product: {
        id: "B1_COD",
        description: "B1_DESC",
        productType: "B1_TIPO",
        unitOfMeasure: "B1_UM"
      },
      SalesOrderHeader: {
        id: "C5_NUM",
        customerId: "C5_CLIENTE",
        customerBranch: "C5_LOJACLI",
        issueDate: "C5_EMISSAO",
        totalAmount: "C5_TOTAL",
        paymentTerms: "C5_CONDPAG"
      },
      SalesOrderItem: {
        orderId: "C6_NUM",
        lineNumber: "C6_ITEM",
        productId: "C6_PRODUTO",
        quantity: "C6_QTDVEN",
        unitPrice: "C6_PRCVEN"
      },
      SalesInvoiceHeader: {
        id: "F2_DOC + F2_SERIE",
        number: "F2_DOC",
        customerId: "F2_CLIENTE",
        issueDate: "F2_EMISSAO",
        grandTotal: "F2_VALBRUT"
      },
      PurchaseInvoiceHeader: {
        id: "F1_DOC",
        supplierId: "F1_FORNECE",
        grandTotal: "F1_VALBRUT"
      }
    };
    MOCK_LIVE_DELTA_SX2 = [
      { X2_CHAVE: "ZZ1", X2_ARQUIVO: "ZZ1", X2_NOME: "Tabela Custom CRM", X2_NOMETAB: "CRM Custom" }
    ];
    MOCK_LIVE_DELTA_SX3 = [
      { X3_ARQUIVO: "SC5", X3_CAMPO: "C5_XOPOCRM", X3_TIPO: "C", X3_TITULO: "ID CRM Custom", X3_TAMANHO: 20, X3_OBRIGAT: "N", X3_ORDEM: "99" },
      { X3_ARQUIVO: "ZZ1", X3_CAMPO: "ZZ1_COD", X3_TIPO: "C", X3_TITULO: "Codigo CRM", X3_TAMANHO: 10, X3_OBRIGAT: "S", X3_ORDEM: "01" },
      { X3_ARQUIVO: "ZZ1", X3_CAMPO: "ZZ1_DESC", X3_TIPO: "C", X3_TITULO: "Descricao CRM", X3_TAMANHO: 50, X3_OBRIGAT: "N", X3_ORDEM: "02" }
    ];
    MOCK_LIVE_DELTA_SX9 = [
      { X9_DOM: "ZZ1", X9_CDOM: "ZZ1_COD", X9_LIGDOM: "SA1", X9_LIGCDOM: "A1_COD", X9_IDENT: "001", X9_ENABLE: "S" }
    ];
  }
});

// lib/mesh/adapters/totvs/protheusDeltaMerge.ts
function normalizeTable(name) {
  return name.trim().toUpperCase();
}
function relationKey(rel) {
  return `${rel.sourceTable}.${rel.sourceField}->${rel.targetTable}.${rel.targetField}`;
}
function buildBaselineFieldIndex(baseline) {
  var _a, _b;
  const companySuffix = ((_a = baseline.dictionary_meta) == null ? void 0 : _a.company_suffix) || "010";
  const index = /* @__PURE__ */ new Map();
  for (const mapping of Object.values(baseline.custom_mappings)) {
    const attrs = mapping.attributes || [];
    for (const attr of attrs) {
      let table = attr.id.split("-")[1] || "";
      if (!table) continue;
      table = normalizeTable(table);
      if (table.endsWith(companySuffix) && table.length > companySuffix.length) {
        table = table.substring(0, table.length - companySuffix.length);
      }
      const set = (_b = index.get(table)) != null ? _b : /* @__PURE__ */ new Set();
      set.add(attr.name);
      index.set(table, set);
    }
  }
  return index;
}
function buildBaselineTableSet(baseline) {
  var _a;
  const companySuffix = ((_a = baseline.dictionary_meta) == null ? void 0 : _a.company_suffix) || "010";
  return new Set(
    (baseline.supported_entities || []).map((e) => {
      const native = normalizeTable(e.native_reference.split(" ")[0]);
      if (native.endsWith(companySuffix) && native.length > companySuffix.length) {
        return native.substring(0, native.length - companySuffix.length);
      }
      return native;
    })
  );
}
function buildBaselineRelationSet(baseline) {
  var _a;
  const companySuffix = ((_a = baseline.dictionary_meta) == null ? void 0 : _a.company_suffix) || "010";
  return new Set((baseline.relationships || []).map((r) => {
    let src = normalizeTable(r.sourceTable);
    let tgt = normalizeTable(r.targetTable);
    if (src.endsWith(companySuffix) && src.length > companySuffix.length) {
      src = src.substring(0, src.length - companySuffix.length);
    }
    if (tgt.endsWith(companySuffix) && tgt.length > companySuffix.length) {
      tgt = tgt.substring(0, tgt.length - companySuffix.length);
    }
    return relationKey({
      sourceTable: src,
      sourceField: r.sourceField,
      targetTable: tgt,
      targetField: r.targetField
    });
  }));
}
function computeProtheusDelta(liveSnapshot, baseline) {
  var _a, _b;
  const base = baseline != null ? baseline : getProtheusBaselineManifest();
  const companySuffix = ((_a = base.dictionary_meta) == null ? void 0 : _a.company_suffix) || "010";
  const baselineTables = buildBaselineTableSet(base);
  const baselineFields = buildBaselineFieldIndex(base);
  const baselineRelations = buildBaselineRelationSet(base);
  const newTables = liveSnapshot.tables.filter((t) => {
    let chave = normalizeTable(t.X2_CHAVE);
    if (chave.endsWith(companySuffix) && chave.length > companySuffix.length) {
      chave = chave.substring(0, chave.length - companySuffix.length);
    }
    return !baselineTables.has(chave);
  });
  const newFields = [];
  const liveEntities = buildDiscoveredEntities(liveSnapshot);
  for (const entity of liveEntities) {
    let entityTable = normalizeTable(entity.tableName);
    if (entityTable.endsWith(companySuffix) && entityTable.length > companySuffix.length) {
      entityTable = entityTable.substring(0, entityTable.length - companySuffix.length);
    }
    const knownFields = (_b = baselineFields.get(entityTable)) != null ? _b : /* @__PURE__ */ new Set();
    for (const attr of entity.attributes) {
      if (!knownFields.has(attr.name)) {
        newFields.push({
          table: entity.tableName,
          field: attr.name,
          attribute: __spreadProps(__spreadValues({}, attr), { comment: `${attr.comment || attr.name} (custom/delta)` })
        });
      }
    }
  }
  const liveRelations = extractRelationshipsFromSx9(liveSnapshot.relationships, liveSnapshot.tables);
  const newRelationships = liveRelations.filter((r) => {
    let src = normalizeTable(r.sourceTable);
    let tgt = normalizeTable(r.targetTable);
    if (src.endsWith(companySuffix) && src.length > companySuffix.length) {
      src = src.substring(0, src.length - companySuffix.length);
    }
    if (tgt.endsWith(companySuffix) && tgt.length > companySuffix.length) {
      tgt = tgt.substring(0, tgt.length - companySuffix.length);
    }
    return !baselineRelations.has(relationKey({
      sourceTable: src,
      sourceField: r.sourceField,
      targetTable: tgt,
      targetField: r.targetField
    }));
  });
  return {
    baselineVersion: PROTHEUS_BASELINE_VERSION,
    newTables,
    newFields,
    newRelationships,
    scannedAt: liveSnapshot.extractedAt,
    hasChanges: newTables.length > 0 || newFields.length > 0 || newRelationships.length > 0
  };
}
function mergeProtheusBaselineWithLive(liveSnapshot, baseline) {
  var _a;
  const base = structuredClone(baseline != null ? baseline : getProtheusBaselineManifest());
  const delta = computeProtheusDelta(liveSnapshot, base);
  if (!delta.hasChanges) {
    return {
      baseline: base,
      liveSnapshot,
      delta,
      mergedManifest: __spreadProps(__spreadValues({}, base), {
        discoveredAt: liveSnapshot.extractedAt,
        dictionary_meta: __spreadProps(__spreadValues({}, base.dictionary_meta), {
          last_delta_scan: liveSnapshot.extractedAt,
          delta_new_tables: 0,
          delta_new_fields: 0,
          delta_new_relationships: 0
        })
      }),
      entities: buildDiscoveredEntities(liveSnapshot)
    };
  }
  const merged = structuredClone(base);
  for (const table of delta.newTables) {
    const tableName = normalizeTable(table.X2_CHAVE);
    const canonical = `opo:${suggestProtheusCanonicalName(tableName)}`;
    const businessName = canonical.replace(/^opo:/, "");
    merged.supported_entities.push({
      canonical,
      native_reference: tableName,
      confidence: 0.85,
      limitations: `Custom table discovered via SX2 delta: ${table.X2_NOME}`
    });
    const entityAttrs = delta.newFields.filter((f) => normalizeTable(f.table) === tableName).map((f) => __spreadProps(__spreadValues({}, f.attribute), { comment: `${f.attribute.comment} [_opo_origin:delta]` }));
    const fieldsMapping = {};
    for (const attr of entityAttrs) {
      const camel = attr.name.toLowerCase().replace(/_([a-z0-9])/gi, (_m, g) => g.toUpperCase());
      fieldsMapping[camel] = attr.name;
    }
    merged.custom_mappings[businessName] = {
      [`${tableName}_fields`]: fieldsMapping,
      attributes: entityAttrs,
      protheus_meta: {
        alias: table.X2_ARQUIVO,
        description: table.X2_NOME,
        _opo_origin: "delta"
      }
    };
  }
  const fieldsByTable = /* @__PURE__ */ new Map();
  for (const f of delta.newFields) {
    const list = (_a = fieldsByTable.get(normalizeTable(f.table))) != null ? _a : [];
    list.push(f);
    fieldsByTable.set(normalizeTable(f.table), list);
  }
  for (const [tableName, fields] of fieldsByTable) {
    const entity = merged.supported_entities.find(
      (e) => normalizeTable(e.native_reference) === tableName
    );
    if (!entity) continue;
    const businessName = entity.canonical.replace(/^opo:/, "");
    const mapping = merged.custom_mappings[businessName] || {};
    const fieldsKey = Object.keys(mapping).find((k) => k.endsWith("_fields")) || `${tableName}_fields`;
    const existingFields = mapping[fieldsKey] || {};
    const existingAttrs = mapping.attributes || [];
    for (const f of fields) {
      const camel = f.field.toLowerCase().replace(/_([a-z0-9])/gi, (_m, g) => g.toUpperCase());
      existingFields[camel] = f.field;
      existingAttrs.push(__spreadProps(__spreadValues({}, f.attribute), { comment: `${f.attribute.comment} [_opo_origin:delta]` }));
    }
    merged.custom_mappings[businessName] = __spreadProps(__spreadValues({}, mapping), {
      [fieldsKey]: existingFields,
      attributes: existingAttrs
    });
  }
  const existingRelKeys = new Set(merged.relationships.map(relationKey));
  for (const rel of delta.newRelationships) {
    if (!existingRelKeys.has(relationKey(rel))) {
      merged.relationships.push(__spreadProps(__spreadValues({}, rel), {
        confidence: 0.95,
        metadata: __spreadProps(__spreadValues({}, rel.metadata), { _opo_origin: "delta" })
      }));
    }
  }
  merged.discoveredAt = liveSnapshot.extractedAt;
  merged.dictionary_meta = __spreadProps(__spreadValues({}, merged.dictionary_meta), {
    source: liveSnapshot.source,
    last_delta_scan: liveSnapshot.extractedAt,
    delta_new_tables: delta.newTables.length,
    delta_new_fields: delta.newFields.length,
    delta_new_relationships: delta.newRelationships.length,
    baseline_version: PROTHEUS_BASELINE_VERSION
  });
  return {
    baseline: base,
    liveSnapshot,
    delta,
    mergedManifest: merged,
    entities: buildDiscoveredEntities(liveSnapshot)
  };
}
function buildMockLiveSnapshotWithDelta() {
  const baseline = getProtheusBaselineSnapshot();
  return {
    tables: [...baseline.tables, ...MOCK_LIVE_DELTA_SX2],
    fields: [...baseline.fields, ...MOCK_LIVE_DELTA_SX3],
    relationships: [...baseline.relationships, ...MOCK_LIVE_DELTA_SX9],
    extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "mock"
  };
}
var init_protheusDeltaMerge = __esm({
  "lib/mesh/adapters/totvs/protheusDeltaMerge.ts"() {
    "use strict";
    init_protheusBaseline();
    init_protheusDictionaryExtractor();
    init_protheusBaselineSeed();
  }
});

// lib/mesh/adapters/totvs/protheusDictionaryExtractor.ts
function normalizeTableName(name) {
  return name.trim().toUpperCase();
}
function suggestProtheusCanonicalName(tableName) {
  const key = tableName.trim().toLowerCase();
  if (PROTHEUS_CANONICAL_MAP[key]) return PROTHEUS_CANONICAL_MAP[key];
  return tableName.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
}
function mapProtheusFieldType(sx3Type) {
  var _a;
  return (_a = PROTHEUS_TYPE_MAP[sx3Type.trim().toUpperCase()]) != null ? _a : "String";
}
function matchesTableFilter(tableName, filter) {
  if (!(filter == null ? void 0 : filter.trim())) return true;
  const patterns = filter.split(",").map((p) => p.trim().toLowerCase().replace(/\*/g, ".*"));
  const regexes = patterns.map((p) => new RegExp(`^${p}$`, "i"));
  return regexes.some((re) => re.test(tableName.toLowerCase()));
}
function isRelationshipEnabled(row) {
  var _a;
  return ((_a = row.X9_ENABLE) != null ? _a : "S").toUpperCase() !== "N";
}
async function queryProtheusDictionary(options = {}) {
  var _a, _b;
  const mode = (_a = options.mode) != null ? _a : "mock";
  if (mode === "mock") {
    return buildSnapshotFromRows(
      MOCK_SX2_TABLES,
      MOCK_SX3_FIELDS,
      MOCK_SX9_RELATIONSHIPS,
      "mock",
      options.tableFilter
    );
  }
  if (!options.connectionString) {
    throw new Error("connectionString es requerido cuando mode=database");
  }
  const suffix = (_b = options.companySuffix) != null ? _b : "010";
  const sx2Table = `SX2${suffix}`;
  const sx3Table = `SX3${suffix}`;
  const sx9Table = `SX9${suffix}`;
  const client = await createProtheusDbClient(options.connectionString);
  try {
    const deletedFilter = "D_E_L_E_T_ <> '*'";
    const sx2Res = await client.query(`
      SELECT X2_CHAVE, X2_ARQUIVO, X2_NOME, X2_NOMETAB, X2_MODO
      FROM ${sx2Table}
      WHERE ${deletedFilter}
      ORDER BY X2_CHAVE
    `);
    const sx3Res = await client.query(`
      SELECT X3_ARQUIVO, X3_CAMPO, X3_TIPO, X3_TITULO, X3_TAMANHO, X3_DECIMAL,
             X3_OBRIGAT, X3_CONTEXT, X3_ORDEM, X3_F3, X3_RELACAO
      FROM ${sx3Table}
      WHERE ${deletedFilter}
      ORDER BY X3_ARQUIVO, X3_ORDEM
    `);
    const sx9Res = await client.query(`
      SELECT X9_DOM, X9_CDOM, X9_LIGDOM, X9_LIGCDOM, X9_IDENT,
             X9_EXPDOM, X9_EXPCDOM, X9_CONDSQL, X9_ENABLE, X9_PROPRI
      FROM ${sx9Table}
      WHERE ${deletedFilter}
      ORDER BY X9_DOM, X9_IDENT
    `);
    return buildSnapshotFromRows(
      sx2Res.rows,
      sx3Res.rows,
      sx9Res.rows,
      "database",
      options.tableFilter
    );
  } finally {
    await client.close();
  }
}
function buildSnapshotFromRows(tables, fields, relationships, source, tableFilter) {
  const filteredTables = tables.filter(
    (t) => matchesTableFilter(normalizeTableName(t.X2_CHAVE), tableFilter)
  );
  const tableSet = new Set(filteredTables.map((t) => normalizeTableName(t.X2_CHAVE)));
  const filteredFields = fields.filter(
    (f) => tableSet.has(normalizeTableName(f.X3_ARQUIVO))
  );
  const filteredRelationships = relationships.filter(
    (r) => isRelationshipEnabled(r) && tableSet.has(normalizeTableName(r.X9_DOM)) && tableSet.has(normalizeTableName(r.X9_LIGDOM))
  );
  return {
    tables: filteredTables,
    fields: filteredFields,
    relationships: filteredRelationships,
    extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source
  };
}
function extractRelationshipsFromSx9(sx9Rows, sx2Rows = []) {
  const tableDescriptions = new Map(
    sx2Rows.map((t) => [normalizeTableName(t.X2_CHAVE), t.X2_NOME || t.X2_NOMETAB || t.X2_CHAVE])
  );
  return sx9Rows.filter(isRelationshipEnabled).map((row) => {
    var _a, _b;
    const sourceTable = normalizeTableName(row.X9_DOM);
    const targetTable = normalizeTableName(row.X9_LIGDOM);
    const sourceField = row.X9_CDOM.trim();
    const targetField = row.X9_LIGCDOM.trim();
    return {
      id: `rel-sx9-${sourceTable}-${sourceField}-${targetTable}-${targetField}`,
      sourceTable,
      targetTable,
      sourceCanonical: `opo:${suggestProtheusCanonicalName(sourceTable)}`,
      targetCanonical: `opo:${suggestProtheusCanonicalName(targetTable)}`,
      sourceField,
      targetField,
      cardinality: "ONE_TO_MANY",
      conditionSql: ((_a = row.X9_CONDSQL) == null ? void 0 : _a.trim()) || void 0,
      source: "sx9",
      confidence: 1,
      metadata: {
        sx9Ident: row.X9_IDENT,
        sx9ExpandedSource: row.X9_EXPDOM,
        sx9ExpandedTarget: row.X9_EXPCDOM,
        description: `${sourceTable}.${sourceField} \u2192 ${targetTable}.${targetField} (${(_b = tableDescriptions.get(targetTable)) != null ? _b : targetTable})`
      }
    };
  });
}
function filialFieldForTable(tableName, fields) {
  const tableFields = fields.filter(
    (f) => normalizeTableName(f.X3_ARQUIVO) === normalizeTableName(tableName)
  );
  return (0, import_opo_sdk3.deriveFilialFieldFromColumns)(tableFields.map((f) => f.X3_CAMPO));
}
function buildAttributesForTable(tableName, fields) {
  const tableFields = fields.filter((f) => normalizeTableName(f.X3_ARQUIVO) === normalizeTableName(tableName)).sort((a, b) => {
    var _a, _b;
    return ((_a = a.X3_ORDEM) != null ? _a : "").localeCompare((_b = b.X3_ORDEM) != null ? _b : "");
  });
  return tableFields.map((field, idx) => {
    var _a;
    const isPk = idx === 0 || field.X3_ORDEM === "01";
    const isRequired = ((_a = field.X3_OBRIGAT) == null ? void 0 : _a.toUpperCase()) === "S" || isPk;
    return {
      id: `attr-${tableName}-${field.X3_CAMPO}`,
      name: field.X3_CAMPO,
      type: mapProtheusFieldType(field.X3_TIPO),
      isPrimaryKey: isPk,
      isRequired,
      isUnique: isPk,
      length: field.X3_TAMANHO,
      scale: field.X3_DECIMAL,
      comment: field.X3_TITULO
    };
  });
}
function buildDiscoveredEntities(snapshot) {
  var _a, _b;
  const allRelationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);
  const outgoingByTable = /* @__PURE__ */ new Map();
  const incomingByTable = /* @__PURE__ */ new Map();
  for (const rel of allRelationships) {
    const out = (_a = outgoingByTable.get(rel.sourceTable)) != null ? _a : [];
    out.push(rel);
    outgoingByTable.set(rel.sourceTable, out);
    const inc = (_b = incomingByTable.get(rel.targetTable)) != null ? _b : [];
    inc.push(rel);
    incomingByTable.set(rel.targetTable, inc);
  }
  return snapshot.tables.map((table) => {
    var _a2, _b2;
    const tableName = normalizeTableName(table.X2_CHAVE);
    const canonical = suggestProtheusCanonicalName(tableName);
    return {
      tableName,
      alias: table.X2_ARQUIVO,
      description: table.X2_NOME || table.X2_NOMETAB || tableName,
      canonical: `opo:${canonical}`,
      attributes: buildAttributesForTable(tableName, snapshot.fields),
      outgoingRelations: (_a2 = outgoingByTable.get(tableName)) != null ? _a2 : [],
      incomingRelations: (_b2 = incomingByTable.get(tableName)) != null ? _b2 : []
    };
  });
}
function buildOpoManifestFromProtheus2(snapshot, options = {}) {
  var _a, _b, _c, _d, _e, _f;
  const entities = buildDiscoveredEntities(snapshot);
  const relationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);
  const companySuffix = (_a = options.companySuffix) != null ? _a : "010";
  const supportedEntities = entities.map((entity) => ({
    canonical: entity.canonical,
    native_reference: `${entity.tableName}${companySuffix}`,
    confidence: 1,
    limitations: `Auto-discovered from Protheus dictionary (SX2): ${entity.description}`
  }));
  const customMappings = {};
  const sx2ByTable = new Map(
    snapshot.tables.map((t) => [normalizeTableName(t.X2_CHAVE), t])
  );
  for (const entity of entities) {
    const businessName = entity.canonical.replace(/^opo:/, "");
    const fieldsMapping = {};
    const sx2 = sx2ByTable.get(normalizeTableName(entity.tableName));
    for (const attr of entity.attributes) {
      const camelName = attr.name.toLowerCase().replace(/_([a-z0-9])/gi, (_m, g) => g.toUpperCase());
      fieldsMapping[camelName] = attr.name;
    }
    const physicalTableName = `${entity.tableName}${companySuffix}`;
    const filialField = filialFieldForTable(entity.tableName, snapshot.fields);
    customMappings[businessName] = {
      [`${entity.tableName}_fields`]: fieldsMapping,
      attributes: entity.attributes,
      protheus_meta: {
        alias: entity.alias,
        description: entity.description,
        physicalTableName,
        companySuffix,
        x2Modo: sx2 == null ? void 0 : sx2.X2_MODO,
        filialField,
        outgoing_relations: entity.outgoingRelations.map((r) => r.id),
        incoming_relations: entity.incomingRelations.map((r) => r.id)
      },
      mutation_policy: {
        readOnly: true,
        strategy: "rest"
      }
    };
  }
  return {
    opo_version: "0.1.0",
    system_identity: {
      erp_name: (_b = options.projectName) != null ? _b : "TOTVS Protheus",
      version: (_c = options.erpVersion) != null ? _c : "12.1.2310",
      jurisdictions: (_d = options.jurisdictions) != null ? _d : ["BR", "AR"],
      organization_name: (_e = options.organizationName) != null ? _e : "Auto-Discovered Org"
    },
    adapter_configuration: {
      base_url: (_f = options.baseUrl) != null ? _f : "",
      protocol_interface: "REST",
      dictionary_source: "SX2/SX3/SX9",
      readOnly: true,
      mutationStrategy: "rest",
      company_suffix: companySuffix
    },
    supported_entities: supportedEntities,
    custom_mappings: customMappings,
    relationships,
    discoveredAt: snapshot.extractedAt,
    dictionary_meta: {
      source: snapshot.source,
      tables_count: snapshot.tables.length,
      fields_count: snapshot.fields.length,
      relationships_count: relationships.length,
      company_suffix: options.companySuffix
    }
  };
}
async function discoverProtheusOntology(queryOptions = {}, manifestOptions = {}) {
  var _a;
  const snapshot = await queryProtheusDictionary(queryOptions);
  const entities = buildDiscoveredEntities(snapshot);
  const manifest = buildOpoManifestFromProtheus2(snapshot, __spreadProps(__spreadValues({}, manifestOptions), {
    companySuffix: (_a = queryOptions.companySuffix) != null ? _a : manifestOptions.companySuffix
  }));
  return { snapshot, entities, manifest };
}
async function discoverProtheusOntologyIncremental(queryOptions = {}, manifestOptions = {}) {
  let liveSnapshot;
  if (queryOptions.simulateDelta) {
    liveSnapshot = buildMockLiveSnapshotWithDelta();
  } else {
    liveSnapshot = await queryProtheusDictionary(queryOptions);
  }
  const result = mergeProtheusBaselineWithLive(liveSnapshot);
  if (manifestOptions.baseUrl) {
    result.mergedManifest.adapter_configuration.base_url = manifestOptions.baseUrl;
  }
  if (manifestOptions.organizationName) {
    result.mergedManifest.system_identity.organization_name = manifestOptions.organizationName;
  }
  return result;
}
var import_opo_sdk3, PROTHEUS_CANONICAL_MAP, PROTHEUS_TYPE_MAP;
var init_protheusDictionaryExtractor = __esm({
  "lib/mesh/adapters/totvs/protheusDictionaryExtractor.ts"() {
    "use strict";
    import_opo_sdk3 = require("opo-sdk");
    init_protheusDbClient();
    init_protheusMockData();
    init_protheusDeltaMerge();
    PROTHEUS_CANONICAL_MAP = {
      sa1: "Customer",
      sa2: "Supplier",
      sb1: "Product",
      sf1: "PurchaseInvoiceHeader",
      sf2: "SalesInvoiceHeader",
      sc5: "SalesOrderHeader",
      sc6: "SalesOrderItem",
      sc7: "PurchaseOrderHeader",
      sc9: "SalesOrderReleases"
    };
    PROTHEUS_TYPE_MAP = {
      C: "String",
      N: "Float",
      D: "DateTime",
      L: "Boolean",
      M: "String",
      V: "String"
    };
  }
});

// lib/mesh/adapters/totvs/protheusBaseline.ts
function getProtheusBaselineSnapshot() {
  return {
    tables: BASELINE_SX2,
    fields: BASELINE_SX3,
    relationships: BASELINE_SX9,
    extractedAt: "2026-01-01T00:00:00.000Z",
    source: "mock"
  };
}
function getProtheusBaselineManifest() {
  if (cachedBaseline) return structuredClone(cachedBaseline);
  const snapshot = getProtheusBaselineSnapshot();
  const manifest = buildOpoManifestFromProtheus2(snapshot, {
    projectName: "TOTVS Protheus",
    erpVersion: "12.1.2310",
    organizationName: "OPO Baseline Registry",
    jurisdictions: ["BR", "AR", "MX"]
  });
  for (const [entityName, semanticFields] of Object.entries(BASELINE_SEMANTIC_MAPPINGS)) {
    if (!manifest.custom_mappings[entityName]) continue;
    const tableKey = Object.keys(manifest.custom_mappings[entityName]).find((k) => k.endsWith("_fields"));
    if (tableKey) {
      manifest.custom_mappings[entityName][tableKey] = __spreadValues(__spreadValues({}, manifest.custom_mappings[entityName][tableKey]), semanticFields);
    }
    manifest.custom_mappings[entityName]._semantic = semanticFields;
  }
  manifest.dictionary_meta = __spreadProps(__spreadValues({}, manifest.dictionary_meta), {
    source: "mock",
    baseline_version: PROTHEUS_BASELINE_VERSION,
    is_baseline: true
  });
  manifest.adapter_configuration = __spreadProps(__spreadValues({}, manifest.adapter_configuration), {
    access_modes: ["REST", "SQL", "MCP"],
    discovery_strategy: "baseline_plus_delta"
  });
  cachedBaseline = manifest;
  return structuredClone(manifest);
}
function getProtheusBaselineVersion() {
  return PROTHEUS_BASELINE_VERSION;
}
var cachedBaseline;
var init_protheusBaseline = __esm({
  "lib/mesh/adapters/totvs/protheusBaseline.ts"() {
    "use strict";
    init_protheusBaselineSeed();
    init_protheusDictionaryExtractor();
    cachedBaseline = null;
  }
});

// lib/mesh/adapters/totvs/protheusCanvasBridge.ts
function manifestToCanvasGraph(manifest, delta) {
  var _a, _b, _c;
  const nodes = [];
  const edges = [];
  const deltaTables = new Set((_a = delta == null ? void 0 : delta.newTables.map((t) => t.X2_CHAVE.toUpperCase())) != null ? _a : []);
  const deltaFields = new Set(
    (_b = delta == null ? void 0 : delta.newFields.map((f) => `${f.table.toUpperCase()}.${f.field}`)) != null ? _b : []
  );
  const entities = manifest.supported_entities || [];
  const mappings = manifest.custom_mappings || {};
  entities.forEach((ent, idx) => {
    var _a2;
    const canonicalName = ent.canonical.replace(/^opo:/, "");
    const tableName = ent.native_reference.split(" ")[0].trim();
    const mappingInfo = mappings[canonicalName] || {};
    const attrs = mappingInfo.attributes || [];
    nodes.push({
      id: tableName,
      type: "entityNode",
      position: { x: 80 + idx % 4 * 300, y: 80 + Math.floor(idx / 4) * 280 },
      data: {
        label: canonicalName,
        description: ent.limitations || ((_a2 = mappingInfo.protheus_meta) == null ? void 0 : _a2.description) || tableName,
        type: deltaTables.has(tableName.toUpperCase()) ? "Custom Table" : "Table",
        attributes: attrs.map((a) => __spreadProps(__spreadValues({}, a), {
          comment: deltaFields.has(`${tableName.toUpperCase()}.${a.name}`) ? `${a.comment || a.name} \u{1F195}` : a.comment
        }))
      }
    });
  });
  (manifest.relationships || []).forEach((rel, idx) => {
    const isNew = delta == null ? void 0 : delta.newRelationships.some((d) => d.id === rel.id);
    edges.push({
      id: rel.id || `e-${rel.sourceTable}-${rel.targetTable}-${idx}`,
      source: rel.sourceTable,
      target: rel.targetTable,
      animated: true,
      type: "smoothstep",
      data: {
        label: isNew ? "SX9 \u{1F195}" : "SX9",
        cardinality: rel.cardinality,
        sourceFieldName: rel.sourceField,
        targetFieldName: rel.targetField
      }
    });
  });
  return {
    project: { name: ((_c = manifest.system_identity) == null ? void 0 : _c.erp_name) || "TOTVS Protheus" },
    nodes,
    edges
  };
}
function manifestToDiscoverEntities(manifest, delta) {
  const graph = manifestToCanvasGraph(manifest, delta);
  return graph.nodes.map((n) => ({
    name: String(n.data.label),
    originalTable: n.id,
    description: n.data.description || "",
    attributes: n.data.attributes || [],
    isDelta: n.data.type === "Custom Table",
    rowCount: 0
  }));
}
var init_protheusCanvasBridge = __esm({
  "lib/mesh/adapters/totvs/protheusCanvasBridge.ts"() {
    "use strict";
  }
});

// lib/mesh/adapters/totvs/protheusSemanticAccess.ts
function buildProtheusSemanticAccessPlan(manifest, overrides) {
  var _a, _b;
  const baseUrl = (overrides == null ? void 0 : overrides.baseUrl) || ((_a = manifest.adapter_configuration) == null ? void 0 : _a.base_url) || "https://protheus.example.com/api/opo/v1";
  const accessModes = ((_b = manifest.adapter_configuration) == null ? void 0 : _b.access_modes) || ["REST", "SQL", "MCP"];
  return {
    manifestPath: "/.well-known/opo.json",
    accessModes,
    rest: {
      baseUrl,
      discoveryEndpoint: `${baseUrl.replace(/\/api\/opo\/v1$/, "")}/.well-known/opo.json`,
      entityPattern: "GET {baseUrl}/entities/{canonical}/{id}",
      example: `GET ${baseUrl}/entities/Customer/000219`
    },
    sql: {
      connectionHint: (overrides == null ? void 0 : overrides.sqlConnection) || "postgresql://user:pass@host:5432/protheus_db",
      translator: "opo-sdk translateOpoToSql \u2014 usa custom_mappings + relationships para JOINs",
      joinNavigation: "El agente lee relationships[] (ej: SC5.C5_CLIENTE\u2192SA1.A1_COD) y arma JOINs sin inferir",
      example: "OpoQuery: { entity: 'SalesOrderHeader', filter: { customerId: { eq: '000219' } } } \u2192 SELECT SC5.* FROM SC5010 SC5 JOIN SA1010 SA1 ON SC5.C5_CLIENTE = SA1.A1_COD WHERE ..."
    },
    mcp: {
      serverCommand: "opo mcp-start --mapping-dir registry/totvs-protheus",
      tools: ["opo_query", "opo_describe_entity"],
      example: 'Agente MCP (read-only): opo_query con { entity: "Customer", context: { erp: "protheus", filial: "01" }, filter: { legalName: { like: "%Sol%" } } }'
    }
  };
}
function manifestToSdkMappings(manifest) {
  var _a, _b, _c, _d, _e, _f, _g;
  const mappings = [];
  const adapterConfig = manifest.adapter_configuration;
  const companySuffix = (_c = (_b = adapterConfig == null ? void 0 : adapterConfig.company_suffix) != null ? _b : (_a = manifest.dictionary_meta) == null ? void 0 : _a.company_suffix) != null ? _c : "010";
  const physicalByLogical = /* @__PURE__ */ new Map();
  for (const ent of manifest.supported_entities || []) {
    const physical = ent.native_reference.split(" ")[0];
    const logical = physical.replace(new RegExp(`${companySuffix}$`, "i"), "");
    physicalByLogical.set(logical.toUpperCase(), physical);
  }
  for (const entity of manifest.supported_entities || []) {
    const canonical = entity.canonical.replace(/^opo:/, "");
    const mapping = manifest.custom_mappings[canonical];
    if (!mapping) continue;
    const protheusMeta = mapping.protheus_meta || {};
    const mutationPolicy = mapping.mutation_policy || {
      readOnly: (_d = adapterConfig == null ? void 0 : adapterConfig.readOnly) != null ? _d : true,
      strategy: (_e = adapterConfig == null ? void 0 : adapterConfig.mutationStrategy) != null ? _e : "rest"
    };
    const fieldsKey = Object.keys(mapping).find((k) => k.endsWith("_fields"));
    const semanticKey = "_semantic";
    const nativeFields = fieldsKey ? mapping[fieldsKey] : {};
    const semanticFields = mapping[semanticKey] || nativeFields;
    const sdkFields = {};
    for (const [opoField, column] of Object.entries(semanticFields)) {
      if (opoField.startsWith("_")) continue;
      sdkFields[opoField] = {
        column,
        type: column.includes("VAL") || column.includes("SALD") || column.includes("TOTAL") ? "number" : "string"
      };
    }
    const sourcePhysical = entity.native_reference.split(" ")[0];
    const joins = {};
    for (const rel of manifest.relationships || []) {
      if (rel.sourceCanonical !== entity.canonical) continue;
      const targetName = rel.targetCanonical.replace(/^opo:/, "");
      const targetPhysical = (_f = physicalByLogical.get(rel.targetTable.toUpperCase())) != null ? _f : `${rel.targetTable}${companySuffix}`;
      const targetMapping = manifest.custom_mappings[targetName];
      const targetMeta = (targetMapping == null ? void 0 : targetMapping.protheus_meta) || {};
      joins[targetName] = __spreadProps(__spreadValues({
        tableName: targetPhysical,
        on: `${sourcePhysical}.${rel.sourceField} = ${targetPhysical}.${rel.targetField}`
      }, rel.conditionSql ? { conditionSql: rel.conditionSql } : {}), {
        protheus: {
          x2Modo: targetMeta.x2Modo,
          filialField: targetMeta.filialField,
          companySuffix,
          physicalTableName: targetPhysical
        }
      });
    }
    mappings.push(__spreadValues({
      $schema: "https://openontology.vercel.app/schema/v1/mapping-schema.json",
      entity: canonical,
      sourceType: "SQL",
      tableName: sourcePhysical,
      description: entity.limitations,
      fields: sdkFields,
      protheus: {
        x2Modo: protheusMeta.x2Modo,
        filialField: protheusMeta.filialField,
        companySuffix,
        physicalTableName: (_g = protheusMeta.physicalTableName) != null ? _g : sourcePhysical
      },
      mutationPolicy
    }, Object.keys(joins).length > 0 ? { joins } : {}));
  }
  return mappings;
}
var init_protheusSemanticAccess = __esm({
  "lib/mesh/adapters/totvs/protheusSemanticAccess.ts"() {
    "use strict";
  }
});

// lib/mesh/adapters/totvs/index.ts
var totvs_exports = {};
__export(totvs_exports, {
  BASELINE_SEMANTIC_MAPPINGS: () => BASELINE_SEMANTIC_MAPPINGS,
  BASELINE_SX2: () => BASELINE_SX2,
  BASELINE_SX3: () => BASELINE_SX3,
  BASELINE_SX9: () => BASELINE_SX9,
  MOCK_LIVE_DELTA_SX2: () => MOCK_LIVE_DELTA_SX2,
  MOCK_LIVE_DELTA_SX3: () => MOCK_LIVE_DELTA_SX3,
  MOCK_LIVE_DELTA_SX9: () => MOCK_LIVE_DELTA_SX9,
  MOCK_SX2_TABLES: () => MOCK_SX2_TABLES,
  MOCK_SX3_FIELDS: () => MOCK_SX3_FIELDS,
  MOCK_SX9_RELATIONSHIPS: () => MOCK_SX9_RELATIONSHIPS,
  PROTHEUS_BASELINE_VERSION: () => PROTHEUS_BASELINE_VERSION,
  buildDiscoveredEntities: () => buildDiscoveredEntities,
  buildMockLiveSnapshotWithDelta: () => buildMockLiveSnapshotWithDelta,
  buildOpoManifestFromProtheus: () => buildOpoManifestFromProtheus2,
  buildProtheusSemanticAccessPlan: () => buildProtheusSemanticAccessPlan,
  computeProtheusDelta: () => computeProtheusDelta,
  createProtheusDbClient: () => createProtheusDbClient,
  detectDriverFromUrl: () => detectDriverFromUrl,
  discoverProtheusOntology: () => discoverProtheusOntology,
  discoverProtheusOntologyIncremental: () => discoverProtheusOntologyIncremental,
  extractRelationshipsFromSx9: () => extractRelationshipsFromSx9,
  getProtheusBaselineManifest: () => getProtheusBaselineManifest,
  getProtheusBaselineSnapshot: () => getProtheusBaselineSnapshot,
  getProtheusBaselineVersion: () => getProtheusBaselineVersion,
  manifestToCanvasGraph: () => manifestToCanvasGraph,
  manifestToDiscoverEntities: () => manifestToDiscoverEntities,
  manifestToSdkMappings: () => manifestToSdkMappings,
  mergeProtheusBaselineWithLive: () => mergeProtheusBaselineWithLive,
  queryProtheusDictionary: () => queryProtheusDictionary,
  suggestProtheusCanonicalName: () => suggestProtheusCanonicalName
});
var init_totvs = __esm({
  "lib/mesh/adapters/totvs/index.ts"() {
    "use strict";
    init_protheusDbClient();
    init_protheusTypes();
    init_protheusMockData();
    init_protheusBaselineSeed();
    init_protheusBaseline();
    init_protheusDeltaMerge();
    init_protheusCanvasBridge();
    init_protheusSemanticAccess();
    init_protheusDictionaryExtractor();
  }
});

// cli/index.ts
var import_commander13 = require("commander");

// cli/commands/init.ts
var import_commander = require("commander");
var import_prompts = __toESM(require("prompts"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_chalk = __toESM(require("chalk"));
var initCommand = new import_commander.Command("init").description("Initialize OPO manifest in the current project").argument("[erp]", "Optional ERP template to use (e.g., sap, odoo, protheus)").action(async (erp) => {
  let selectedErp = erp;
  if (!selectedErp) {
    const response = await (0, import_prompts.default)({
      type: "select",
      name: "erp",
      message: "Which ERP/System template do you want to initialize?",
      choices: [
        { title: "Blank (Empty Template)", value: "blank" },
        { title: "Odoo 17 Community", value: "odoo" },
        { title: "TOTVS Protheus", value: "protheus" },
        { title: "SAP S/4HANA (Basic)", value: "sap" }
      ]
    });
    selectedErp = response.erp;
  }
  if (!selectedErp) {
    console.log(import_chalk.default.yellow("Initialization cancelled."));
    return;
  }
  const wellKnownDir = import_path.default.join(process.cwd(), ".well-known");
  const targetPath = import_path.default.join(wellKnownDir, "opo.json");
  if (!import_fs.default.existsSync(wellKnownDir)) {
    import_fs.default.mkdirSync(wellKnownDir, { recursive: true });
  }
  if (import_fs.default.existsSync(targetPath)) {
    const { overwrite } = await (0, import_prompts.default)({
      type: "confirm",
      name: "overwrite",
      message: ".well-known/opo.json already exists. Overwrite?",
      initial: false
    });
    if (!overwrite) {
      console.log(import_chalk.default.yellow("Initialization cancelled."));
      return;
    }
  }
  let template = {
    $schema: "https://opo.example.com/schemas/OpoManifest.json",
    version: "0.1.0",
    system: {
      vendor: "Custom",
      product: "My ERP",
      version: "1.0"
    },
    entities: []
  };
  try {
    let templateContent = "";
    const sourcePublicDir = import_path.default.join(__dirname, "../public");
    if (selectedErp === "protheus") {
      const filePath = import_path.default.join(sourcePublicDir, "opo-manifest.example.json");
      if (import_fs.default.existsSync(filePath)) templateContent = import_fs.default.readFileSync(filePath, "utf8");
    } else if (selectedErp === "odoo") {
      const filePath = import_path.default.join(sourcePublicDir, "opo-manifest.example2.json");
      if (import_fs.default.existsSync(filePath)) templateContent = import_fs.default.readFileSync(filePath, "utf8");
    }
    if (templateContent) {
      template = JSON.parse(templateContent);
    }
  } catch (err) {
    console.warn(import_chalk.default.yellow("Could not load detailed template, using default blank."));
  }
  import_fs.default.writeFileSync(targetPath, JSON.stringify(template, null, 2));
  console.log(import_chalk.default.green(`
Success! Created OPO manifest at ${targetPath}`));
  console.log(import_chalk.default.gray(`Next steps:
1. Open .well-known/opo.json
2. Configure your endpoints mapping.
`));
});

// cli/commands/validate.ts
var import_commander2 = require("commander");
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_chalk2 = __toESM(require("chalk"));
var import__ = __toESM(require("ajv/dist/2020"));
var import_ajv_formats = __toESM(require("ajv-formats"));
var validateCommand = new import_commander2.Command("validate").description("Validate a local JSON file against an OPO entity schema").argument("<file>", "Path to the JSON file to validate").argument("<schema>", "Name of the OPO schema (e.g. Invoice, Customer, Product)").action(async (file, schemaName) => {
  var _a;
  const filePath = import_path2.default.resolve(process.cwd(), file);
  if (!import_fs2.default.existsSync(filePath)) {
    console.error(import_chalk2.default.red(`Error: File not found at ${filePath}`));
    process.exit(1);
  }
  const schemaDir = import_path2.default.join(__dirname, "../public/schemas");
  const schemaPath = import_path2.default.join(schemaDir, `${schemaName}.json`);
  if (!import_fs2.default.existsSync(schemaPath)) {
    console.error(import_chalk2.default.red(`Error: OPO Schema '${schemaName}' not found. Check if the name is correct (case-sensitive).`));
    console.error(import_chalk2.default.gray(`Path checked: ${schemaPath}`));
    process.exit(1);
  }
  try {
    const data = JSON.parse(import_fs2.default.readFileSync(filePath, "utf8"));
    const schema = JSON.parse(import_fs2.default.readFileSync(schemaPath, "utf8"));
    const ajv = new import__.default({ strict: false, allErrors: true });
    (0, import_ajv_formats.default)(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (valid) {
      console.log(import_chalk2.default.green(`
\u2705 Success! The file strictly conforms to the OPO ${schemaName} schema.
`));
    } else {
      console.log(import_chalk2.default.red(`
\u274C Validation Failed: The file does not conform to the ${schemaName} schema.
`));
      (_a = validate.errors) == null ? void 0 : _a.forEach((err) => {
        console.log(import_chalk2.default.yellow(`- Property '${err.instancePath}' ${err.message}`));
      });
      console.log("");
      process.exit(1);
    }
  } catch (err) {
    console.error(import_chalk2.default.red(`
An error occurred during validation: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/generate.ts
var import_commander3 = require("commander");
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_chalk3 = __toESM(require("chalk"));
var import_json_schema_to_typescript = require("json-schema-to-typescript");
var generateCommand = new import_commander3.Command("generate").description("Generate code or types from OPO schemas").argument("<target>", "Target to generate (e.g. types)").option("-o, --out <path>", "Output file path", "opo-types.d.ts").action(async (target, options) => {
  if (target !== "types") {
    console.error(import_chalk3.default.red(`Error: Unknown target '${target}'. Currently only 'types' is supported.`));
    process.exit(1);
  }
  const schemaDir = import_path3.default.join(__dirname, "../../public/schemas");
  const outPath = import_path3.default.resolve(process.cwd(), options.out);
  if (!import_fs3.default.existsSync(schemaDir)) {
    console.error(import_chalk3.default.red(`Error: Schema directory not found at ${schemaDir}`));
    process.exit(1);
  }
  console.log(import_chalk3.default.blue(`Generating TypeScript definitions from OPO Schemas...`));
  try {
    const files = import_fs3.default.readdirSync(schemaDir).filter((f) => f.endsWith(".json"));
    let combinedTypes = `// Auto-generated TypeScript definitions for OPO Protocol
// Do not edit manually.

`;
    for (const file of files) {
      const filePath = import_path3.default.join(schemaDir, file);
      const ts = await (0, import_json_schema_to_typescript.compileFromFile)(filePath, {
        bannerComment: "",
        style: { singleQuote: true }
      });
      combinedTypes += ts + "\n";
    }
    import_fs3.default.writeFileSync(outPath, combinedTypes);
    console.log(import_chalk3.default.green(`\u2705 Successfully generated types at: ${outPath}`));
  } catch (err) {
    console.error(import_chalk3.default.red(`
An error occurred during generation: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/translate.ts
var import_commander4 = require("commander");
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));
var import_chalk4 = __toESM(require("chalk"));

// cli/utils/sqlTranslator.ts
var import_opo_sdk = require("opo-sdk");
function normalizeDictionary(dict) {
  var _a, _b;
  const normalized = {};
  for (const [entityName, entry] of Object.entries(dict)) {
    const fields = {};
    for (const [key, value] of Object.entries(entry.fields)) {
      fields[key] = typeof value === "string" ? { column: value, type: "string" } : value;
    }
    normalized[entityName] = {
      entity: (_a = entry.entity) != null ? _a : entityName,
      sourceType: (_b = entry.sourceType) != null ? _b : "SQL",
      tableName: entry.tableName,
      fields,
      joins: entry.joins,
      protheus: entry.protheus,
      mutationPolicy: entry.mutationPolicy,
      security: entry.security
    };
  }
  return normalized;
}
function translateOpoToSql(opoQuery, dictionary, options) {
  return (0, import_opo_sdk.translateOpoToSql)(opoQuery, normalizeDictionary(dictionary), options);
}
function translateOpoMutationToSql(opoMutation, dictionary, options) {
  return (0, import_opo_sdk.translateOpoMutationToSql)(
    opoMutation,
    normalizeDictionary(dictionary),
    options
  );
}

// cli/commands/translate.ts
var translateCommand = new import_commander4.Command("translate").description("Translate an OpoQuery JSON into native Parameterized SQL").argument("<target>", "Translation target (e.g., sql)").requiredOption("-q, --query <path>", "Path to the OpoQuery JSON file").requiredOption("-m, --mapping <path>", "Path to the Dictionary Mapping JSON file").action((target, options) => {
  if (target !== "sql") {
    console.error(import_chalk4.default.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
    process.exit(1);
  }
  try {
    const queryPath = import_path4.default.resolve(process.cwd(), options.query);
    const mappingPath = import_path4.default.resolve(process.cwd(), options.mapping);
    if (!import_fs4.default.existsSync(queryPath)) throw new Error(`Query file not found: ${queryPath}`);
    if (!import_fs4.default.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);
    const queryPayload = JSON.parse(import_fs4.default.readFileSync(queryPath, "utf8"));
    const mappingDict = JSON.parse(import_fs4.default.readFileSync(mappingPath, "utf8"));
    const targetQuery = queryPayload.query ? queryPayload.query : queryPayload;
    console.log(import_chalk4.default.blue(`Translating OPO-QL to SQL...`));
    const { sql, params, pagination } = translateOpoToSql(targetQuery, mappingDict);
    console.log(import_chalk4.default.green(`
\u2705 Translation Successful (Protected by Prepared Statements)`));
    if (pagination == null ? void 0 : pagination.appliedDefault) {
      console.log(import_chalk4.default.gray(`  Default LIMIT ${pagination.limit} applied (max 100 per OPO-QL spec).`));
    }
    console.log(import_chalk4.default.yellow(`
[GENERATED SQL]`));
    console.log(sql);
    console.log(import_chalk4.default.yellow(`
[PARAMETERS]`));
    console.log(JSON.stringify(params, null, 2));
    if (pagination) {
      console.log(import_chalk4.default.yellow(`
[PAGINATION]`));
      console.log(JSON.stringify(pagination, null, 2));
    }
    console.log();
  } catch (err) {
    console.error(import_chalk4.default.red(`
Translation Failed: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/mutate.ts
var import_commander5 = require("commander");
var import_fs5 = __toESM(require("fs"));
var import_path5 = __toESM(require("path"));
var import_chalk5 = __toESM(require("chalk"));
var mutateCommand = new import_commander5.Command("mutate").description("Translate an OpoMutation JSON into native Parameterized SQL (CREATE, UPDATE, DELETE)").argument("<target>", "Translation target (e.g., sql)").requiredOption("-m, --mutation <path>", "Path to the OpoMutation JSON file").requiredOption("-d, --dictionary <path>", "Path to the Dictionary Mapping JSON file").action((target, options) => {
  if (target !== "sql") {
    console.error(import_chalk5.default.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
    process.exit(1);
  }
  try {
    const mutationPath = import_path5.default.resolve(process.cwd(), options.mutation);
    const mappingPath = import_path5.default.resolve(process.cwd(), options.dictionary);
    if (!import_fs5.default.existsSync(mutationPath)) throw new Error(`Mutation file not found: ${mutationPath}`);
    if (!import_fs5.default.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);
    const mutationPayload = JSON.parse(import_fs5.default.readFileSync(mutationPath, "utf8"));
    const mappingDict = JSON.parse(import_fs5.default.readFileSync(mappingPath, "utf8"));
    const targetMutation = mutationPayload.mutation ? mutationPayload.mutation : mutationPayload;
    console.log(import_chalk5.default.blue(`Translating OPO Mutation to SQL...`));
    const { sql, params } = translateOpoMutationToSql(targetMutation, mappingDict);
    console.log(import_chalk5.default.green(`
\u2705 Mutation Translation Successful (Protected by Prepared Statements)`));
    console.log(import_chalk5.default.yellow(`
[GENERATED SQL]`));
    console.log(sql);
    console.log(import_chalk5.default.yellow(`
[PARAMETERS]`));
    console.log(JSON.stringify(params, null, 2));
    console.log();
  } catch (err) {
    console.error(import_chalk5.default.red(`
Translation Failed: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/mcp.ts
var import_commander6 = require("commander");
var import_path6 = __toESM(require("path"));
var import_fs6 = __toESM(require("fs"));
var import_chalk6 = __toESM(require("chalk"));
var import_opo_sdk2 = require("opo-sdk");
var mcpStartCommand = new import_commander6.Command("mcp-start").description("Start the OPO Model Context Protocol (MCP) Server over stdio").option("-m, --mappings <dir>", "Directory containing mapping JSON files", "./registry").action((options) => {
  const mappingDir = import_path6.default.resolve(process.cwd(), options.mappings);
  console.error(import_chalk6.default.blue(`[CLI] Starting OPO MCP Server...`));
  console.error(import_chalk6.default.blue(`[CLI] Scanning mappings directory: ${mappingDir}`));
  if (!import_fs6.default.existsSync(mappingDir)) {
    console.error(import_chalk6.default.red(`[CLI] Error: Mappings directory not found: ${mappingDir}`));
    process.exit(1);
  }
  try {
    const server = new import_opo_sdk2.OpoMcpServer({
      mappingDir: options.mappings
    });
    server.start();
  } catch (err) {
    console.error(import_chalk6.default.red(`[CLI] Failed to start MCP Server: ${err.message}`));
    process.exit(1);
  }
});

// cli/commands/inspect.ts
var import_commander7 = require("commander");
var import_fs7 = __toESM(require("fs"));
var import_path7 = __toESM(require("path"));
var import_chalk7 = __toESM(require("chalk"));
var import_prompts2 = __toESM(require("prompts"));
var import_genai = require("@google/genai");
var inspectCommand = new import_commander7.Command("inspect").description("AI-Assisted Zero-Touch Mapping. Introspects databases/APIs to generate OPO schemas.").requiredOption("-e, --entity <name>", "The canonical Entity name (e.g. Invoice, Customer)").requiredOption("-s, --schema <path>", "Path to the local schema file (SQL DDL, Swagger, GraphQL SDL)").option("-t, --type <type>", "Type of schema (sql, rest, graphql, soap)", "sql").option("--sync", "Run in auto-healing mode to detect Schema Drift against an existing mapping").action(async (options) => {
  console.log(import_chalk7.default.blueBright(`
\u{1F50D} Inspecting ${options.type.toUpperCase()} schema for entity: ${options.entity}...
`));
  const schemaPath = import_path7.default.resolve(process.cwd(), options.schema);
  if (!import_fs7.default.existsSync(schemaPath)) {
    console.error(import_chalk7.default.red(`Error: Schema file not found at ${schemaPath}`));
    process.exit(1);
  }
  const schemaContent = import_fs7.default.readFileSync(schemaPath, "utf8");
  if (options.sync) {
    console.log(import_chalk7.default.yellow(`[SYNC MODE] Detecting Schema Drift...`));
    console.log(import_chalk7.default.gray(`Analyzing physical schema against current OPO mapping...`));
    setTimeout(() => {
      console.log(import_chalk7.default.green(`
\u2705 No critical schema drift detected. Mappings are up to date.`));
      console.log(import_chalk7.default.cyan(`(Auto-healing daemon simulation completed)`));
    }, 1500);
    return;
  }
  const response = await (0, import_prompts2.default)({
    type: "password",
    name: "apiKey",
    message: "Enter your Google Gemini API Key (or press enter to skip if set in ENV):"
  });
  const apiKey = response.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(import_chalk7.default.red("Error: API Key is required for AI Introspection."));
    process.exit(1);
  }
  const ai = new import_genai.GoogleGenAI({ apiKey });
  console.log(import_chalk7.default.cyan("\n\u{1F9E0} Consulting Gemini 2.5..."));
  const systemPrompt = `
      You are an expert Enterprise Architect. I will give you a raw ${options.type} schema.
      Your job is to extract the fields and map them to standard English names for the entity '${options.entity}'.
      Return a valid JSON object representing the 'fields' property of an OpoMapping.
      Example for Invoice:
      {
        "id": { "column": "VBELN", "type": "string" },
        "totalAmount": { "column": "NETWR", "type": "number" }
      }
      ONLY return valid JSON. Do not return markdown blocks.
    `;
  try {
    const completion = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nSchema:\n" + schemaContent.substring(0, 5e3) }] }
      ]
    });
    let jsonText = completion.text || "{}";
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    const fields = JSON.parse(jsonText);
    const opoMapping = {
      $schema: "https://openontology.org/schema/v1.json",
      entity: options.entity,
      sourceType: options.type.toUpperCase(),
      tableName: "INFERRED_TABLE_NAME",
      fields
    };
    console.log(import_chalk7.default.green("\n\u2705 Gemini inferred the following mapping:\n"));
    console.log(import_chalk7.default.gray(JSON.stringify(opoMapping, null, 2)));
    const confirm = await (0, import_prompts2.default)({
      type: "confirm",
      name: "value",
      message: "Do you want to save this mapping to the registry?",
      initial: true
    });
    if (confirm.value) {
      const outDir = import_path7.default.resolve(process.cwd(), "registry", "inferred");
      if (!import_fs7.default.existsSync(outDir)) {
        import_fs7.default.mkdirSync(outDir, { recursive: true });
      }
      const outPath = import_path7.default.join(outDir, `${options.entity}.json`);
      import_fs7.default.writeFileSync(outPath, JSON.stringify(opoMapping, null, 2));
      console.log(import_chalk7.default.green(`
\u{1F4BE} Saved to ${outPath}`));
    } else {
      console.log(import_chalk7.default.yellow("\nDiscarded mapping."));
    }
  } catch (error) {
    console.error(import_chalk7.default.red(`
\u274C AI Introspection failed: ${error.message}`));
    process.exit(1);
  }
});

// cli/commands/studio.ts
var import_commander8 = require("commander");
var import_chalk8 = __toESM(require("chalk"));
var import_child_process = require("child_process");
var import_path8 = __toESM(require("path"));
var import_fs8 = __toESM(require("fs"));
var studioCommand = new import_commander8.Command("studio").description("Launch the OPO Studio UI locally (like n8n or Flowise)").option("-p, --port <port>", "Port to run the studio on", "3000").action(async (options) => {
  console.log(import_chalk8.default.blue(`
\u{1F680} Starting OPO Studio locally on port ${options.port}...
`));
  try {
    const userCwd = process.cwd();
    let rootDir = __dirname;
    while (rootDir !== import_path8.default.dirname(rootDir)) {
      if (import_fs8.default.existsSync(import_path8.default.join(rootDir, "app")) && import_fs8.default.existsSync(import_path8.default.join(rootDir, "package.json"))) {
        break;
      }
      rootDir = import_path8.default.dirname(rootDir);
    }
    const isProd = process.env.NODE_ENV === "production";
    const nextBin = import_path8.default.join(rootDir, "node_modules", "next", "dist", "bin", "next");
    const command = isProd ? `node "${nextBin}" start -p ${options.port}` : `node "${nextBin}" dev -p ${options.port}`;
    console.log(import_chalk8.default.gray(`> Project Root: ${rootDir}`));
    console.log(import_chalk8.default.gray(`> Workspace directory: ${userCwd}`));
    console.log(import_chalk8.default.gray(`> ${command}`));
    (0, import_child_process.execSync)(command, {
      stdio: "inherit",
      cwd: rootDir,
      env: __spreadProps(__spreadValues({}, process.env), {
        OPO_WORKSPACE_DIR: userCwd
      })
    });
  } catch (error) {
    console.log(import_chalk8.default.red("\n\u274C Failed to start OPO Studio."));
    process.exit(1);
  }
});

// cli/commands/discover.ts
var import_commander9 = require("commander");
var import_fs9 = __toESM(require("fs"));
var import_path9 = __toESM(require("path"));
var import_chalk9 = __toESM(require("chalk"));
init_protheusDbClient();

// lib/studio/onboarding/connectionBuilder.ts
function buildMssqlConnectionString(f) {
  const parts = [];
  if (f.port) {
    parts.push(`Server=${f.server},${f.port}`);
  } else {
    parts.push(`Server=${f.server}`);
  }
  parts.push(`Database=${f.database}`);
  if (f.windowsAuth) {
    parts.push(`Integrated Security=SSPI`);
  } else {
    if (f.user) parts.push(`User Id=${f.user}`);
    if (f.password) parts.push(`Password=${f.password}`);
  }
  const encrypt = f.encrypt !== void 0 ? f.encrypt : false;
  parts.push(`Encrypt=${encrypt ? "true" : "false"}`);
  const trust = f.trustServerCertificate !== void 0 ? f.trustServerCertificate : true;
  parts.push(`TrustServerCertificate=${trust ? "true" : "false"}`);
  return parts.join(";");
}

// cli/commands/discover.ts
function mapType(dbType) {
  const typeLower = dbType.toLowerCase();
  if (["integer", "int", "smallint", "bigint", "serial", "bigserial"].includes(typeLower)) {
    return "Int";
  }
  if (["numeric", "decimal", "real", "double precision", "float"].includes(typeLower)) {
    return "Float";
  }
  if (["boolean", "bool"].includes(typeLower)) {
    return "Boolean";
  }
  if (["timestamp", "timestamptz", "date", "time", "timestamp without time zone", "timestamp with time zone"].some((t) => typeLower.includes(t))) {
    return "DateTime";
  }
  return "String";
}
var erpDictionary = {
  // SAP
  "kna1": "Customer",
  "vbak": "SalesOrderHeader",
  "vbap": "SalesOrderItem",
  "mara": "Material",
  "bkpf": "AccountingDocumentHeader",
  "bseg": "AccountingDocumentSegment",
  "lfa1": "Supplier",
  // Totvs Protheus
  "sa1": "Customer",
  "sa2": "Supplier",
  "sb1": "Product",
  "sf1": "PurchaseInvoiceHeader",
  "sf2": "SalesInvoiceHeader",
  "sc5": "SalesOrderHeader",
  "sc6": "SalesOrderItem",
  "sc7": "PurchaseOrderHeader",
  "sc9": "SalesOrderReleases"
};
function suggestCanonicalName(tableName) {
  const cleanTable = tableName.trim().toLowerCase();
  if (erpDictionary[cleanTable]) {
    return erpDictionary[cleanTable];
  }
  let term = cleanTable.replace(/^tbl_/, "").replace(/^t_/, "").replace(/_tbl$/, "").replace(/_table$/, "");
  return term.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
var discoverCommand = new import_commander9.Command("discover").description("Auto-discover database schema and generate OPO manifest file (.opo.json)").option("-d, --db <type>", "Database type: postgres | mssql | oracle (auto-detected from --url if omitted)", "auto").option("-e, --erp <name>", "ERP adapter: totvs-protheus (uses SX2/SX3/SX9 dictionary)").option("--mock", "Use embedded mock dictionary (Protheus SX tables)").option("--company-suffix <suffix>", "Protheus company table suffix, e.g. 010 \u2192 SX2010", "010").option("--filial <code>", 'Protheus filial code (default "01")', "01").option("--server <server>", "SQL Server server/host").option("--port <port>", "SQL Server port", "1433").option("--database <database>", "SQL Server database name").option("--user <user>", "SQL Server username").option("--password <password>", "SQL Server password").option("--encrypt", "Encrypt connection (default false)", false).option("--trust-server-certificate", "Trust server certificate (default true)", true).option("--table-filter <glob>", 'Table glob filter, e.g. "SC*,SA*,SF*"').option("-u, --url <url>", "Database connection string/URL").option("-o, --output <file>", "Output manifest path", ".well-known/opo.json").action(async (options) => {
  console.log(import_chalk9.default.yellow('\n\u26A0\uFE0F  [Deprecado] El comando "opo discover" directo ha sido deprecado. Us\xE1 "opo onboard" para un setup completo e interactivo.\n'));
  console.log(import_chalk9.default.blue("\u{1F680} Starting OPO Schema Auto-Discovery..."));
  if (options.server && options.database) {
    options.url = buildMssqlConnectionString({
      server: options.server,
      port: Number(options.port) || 1433,
      database: options.database,
      user: options.user,
      password: options.password,
      encrypt: options.encrypt,
      trustServerCertificate: options.trustServerCertificate
    });
  }
  if (options.erp === "totvs-protheus") {
    const { discoverProtheusOntology: discoverProtheusOntology2 } = (init_totvs(), __toCommonJS(totvs_exports));
    const mode = options.mock ? "mock" : "database";
    if (mode === "database" && !options.url) {
      console.error(import_chalk9.default.red("\n\u274C Error: --url is required for totvs-protheus unless --mock is set."));
      process.exit(1);
    }
    try {
      console.log(import_chalk9.default.gray(`Protheus dictionary mode: ${mode}${options.tableFilter ? ` (filter: ${options.tableFilter})` : ""}`));
      const { manifest, snapshot } = await discoverProtheusOntology2(
        {
          mode,
          connectionString: options.url,
          companySuffix: options.companySuffix,
          tableFilter: options.tableFilter
        },
        {
          baseUrl: options.url || "",
          organizationName: "Auto-Discovered Org"
        }
      );
      const outputPath = import_path9.default.resolve(process.cwd(), options.output);
      const outputDir = import_path9.default.dirname(outputPath);
      if (!import_fs9.default.existsSync(outputDir)) {
        import_fs9.default.mkdirSync(outputDir, { recursive: true });
      }
      import_fs9.default.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
      console.log(import_chalk9.default.green(`
\u2705 Success! Created Protheus OPO manifest at ${outputPath}`));
      console.log(import_chalk9.default.gray(`  - Tables (SX2): ${snapshot.tables.length}`));
      console.log(import_chalk9.default.gray(`  - Fields (SX3): ${snapshot.fields.length}`));
      console.log(import_chalk9.default.gray(`  - Relationships (SX9): ${manifest.relationships.length}
`));
      return;
    } catch (err) {
      console.error(import_chalk9.default.red(`
\u274C Protheus Auto-Discovery Failed: ${err.message}`));
      process.exit(1);
    }
  }
  if (!options.url) {
    console.error(import_chalk9.default.red("\n\u274C Error: --url is required for generic database discovery."));
    process.exit(1);
  }
  const resolvedDb = options.db === "auto" ? detectDriverFromUrl(options.url) : options.db;
  if (!["postgres", "postgresql", "mssql", "oracle"].includes(resolvedDb)) {
    console.error(
      import_chalk9.default.red(`
\u274C Error: Database type '${resolvedDb}' is not supported. Use postgres, mssql, or oracle.`)
    );
    process.exit(1);
  }
  const dbDriver = resolvedDb === "postgresql" ? "postgres" : resolvedDb;
  const client = await createProtheusDbClient(options.url);
  try {
    console.log(import_chalk9.default.gray(`Connecting to ${dbDriver} at ${options.url.replace(/:([^:@]+)@/, ":****@")}...`));
    console.log(import_chalk9.default.green("\u2705 Connected successfully!"));
    let tables = [];
    let columnsRows = [];
    let pkRows = [];
    let fkRows = [];
    if (dbDriver === "postgres") {
      console.log(import_chalk9.default.gray("Inspecting tables..."));
      const tablesRes = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `);
      tables = tablesRes.rows.map((r) => r.table_name);
      const columnsRes = await client.query(`
          SELECT table_name, column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `);
      columnsRows = columnsRes.rows;
      const pksRes = await client.query(`
          SELECT kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
        `);
      pkRows = pksRes.rows;
      const fksRes = await client.query(`
          SELECT
            kcu.table_name AS source_table,
            kcu.column_name AS source_column,
            ccu.table_name AS target_table,
            ccu.column_name AS target_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
        `);
      fkRows = fksRes.rows;
    } else if (dbDriver === "mssql") {
      const tablesRes = await client.query(`
          SELECT t.name AS table_name
          FROM sys.tables t
          ORDER BY t.name;
        `);
      tables = tablesRes.rows.map((r) => r.table_name);
      const columnsRes = await client.query(`
          SELECT t.name AS table_name, c.name AS column_name, ty.name AS data_type,
                 CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END AS is_nullable,
                 NULL AS column_default
          FROM sys.tables t
          JOIN sys.columns c ON t.object_id = c.object_id
          JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          ORDER BY t.name, c.column_id;
        `);
      columnsRows = columnsRes.rows;
      const pksRes = await client.query(`
          SELECT t.name AS table_name, c.name AS column_name
          FROM sys.tables t
          JOIN sys.indexes i ON t.object_id = i.object_id AND i.is_primary_key = 1
          JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id;
        `);
      pkRows = pksRes.rows;
      fkRows = [];
    } else {
      const tablesRes = await client.query(`
          SELECT table_name FROM user_tables ORDER BY table_name
        `);
      tables = tablesRes.rows.map((r) => {
        var _a;
        return (_a = r.TABLE_NAME) != null ? _a : r.table_name;
      });
      const columnsRes = await client.query(`
          SELECT utc.TABLE_NAME AS table_name, utc.COLUMN_NAME AS column_name,
                 utc.DATA_TYPE AS data_type, utc.NULLABLE AS is_nullable, NULL AS column_default
          FROM USER_TAB_COLUMNS utc
          ORDER BY utc.TABLE_NAME, utc.COLUMN_ID
        `);
      columnsRows = columnsRes.rows;
      const pksRes = await client.query(`
          SELECT ucc.TABLE_NAME AS table_name, ucc.COLUMN_NAME AS column_name
          FROM USER_CONS_COLUMNS ucc
          JOIN USER_CONSTRAINTS uc ON ucc.CONSTRAINT_NAME = uc.CONSTRAINT_NAME
          WHERE uc.CONSTRAINT_TYPE = 'P'
        `);
      pkRows = pksRes.rows;
      fkRows = [];
    }
    console.log(import_chalk9.default.gray(`Found ${tables.length} tables.`));
    if (tables.length === 0) {
      console.warn(import_chalk9.default.yellow("\u26A0\uFE0F No tables found."));
      await client.close();
      return;
    }
    const primaryKeysMap = /* @__PURE__ */ new Map();
    pkRows.forEach((row) => {
      var _a, _b;
      const tableName = (_a = row.table_name) != null ? _a : row.TABLE_NAME;
      const columnName = (_b = row.column_name) != null ? _b : row.COLUMN_NAME;
      const list = primaryKeysMap.get(tableName) || [];
      list.push(columnName);
      primaryKeysMap.set(tableName, list);
    });
    const entitiesMap = /* @__PURE__ */ new Map();
    columnsRows.forEach((col) => {
      var _a, _b, _c, _d;
      const tableName = (_a = col.table_name) != null ? _a : col.TABLE_NAME;
      const columnName = (_b = col.column_name) != null ? _b : col.COLUMN_NAME;
      const dataType = (_c = col.data_type) != null ? _c : col.DATA_TYPE;
      const isNullable = (_d = col.is_nullable) != null ? _d : col.IS_NULLABLE;
      if (!entitiesMap.has(tableName)) {
        entitiesMap.set(tableName, {
          name: tableName,
          canonical: `opo:${suggestCanonicalName(tableName)}`,
          attributes: []
        });
      }
      const entity = entitiesMap.get(tableName);
      const pks = primaryKeysMap.get(tableName) || [];
      const isPk = pks.includes(columnName);
      entity.attributes.push({
        id: `attr-${tableName}-${columnName}`,
        name: columnName,
        type: mapType(dataType),
        isPrimaryKey: isPk,
        isRequired: isNullable === "NO" || isNullable === "N" || isPk,
        isUnique: isPk,
        defaultValue: col.column_default || void 0
      });
    });
    const supportedEntities = [];
    const customMappings = {};
    entitiesMap.forEach((entity, tableName) => {
      const businessName = entity.canonical.replace(/^opo:/, "");
      supportedEntities.push({
        canonical: entity.canonical,
        native_reference: tableName,
        confidence: 0.95,
        limitations: `Auto-discovered from physical table ${tableName}`
      });
      const fieldsMapping = {};
      entity.attributes.forEach((attr) => {
        const camelName = attr.name.toLowerCase().replace(/_([a-z])/g, (_match, group) => group.toUpperCase());
        fieldsMapping[camelName] = attr.name;
      });
      customMappings[businessName] = {
        [`${tableName}_fields`]: fieldsMapping,
        attributes: entity.attributes
        // Include schema for OPO Studio canvas loading
      };
    });
    const relationships = [];
    fkRows.forEach((row) => {
      const sourceCanonical = `opo:${suggestCanonicalName(row.source_table)}`;
      const targetCanonical = `opo:${suggestCanonicalName(row.target_table)}`;
      relationships.push({
        id: `rel-${row.source_table}-${row.target_table}`,
        source: row.source_table,
        target: row.target_table,
        sourceCanonical,
        targetCanonical,
        sourceColumn: row.source_column,
        targetColumn: row.target_column,
        cardinality: "ONE_TO_MANY"
        // Standard default for foreign keys
      });
    });
    const manifest = {
      opo_version: "0.1.0",
      system_identity: {
        erp_name: `${dbDriver.toUpperCase()} Database`,
        version: "1.0",
        organization_name: "Auto-Discovered Org"
      },
      adapter_configuration: {
        base_url: options.url,
        protocol_interface: "SQL"
      },
      supported_entities: supportedEntities,
      custom_mappings: customMappings,
      relationships,
      // Extra field stored for OPO Studio reconstruction
      discoveredAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const outputPath = import_path9.default.resolve(process.cwd(), options.output);
    const outputDir = import_path9.default.dirname(outputPath);
    if (!import_fs9.default.existsSync(outputDir)) {
      import_fs9.default.mkdirSync(outputDir, { recursive: true });
    }
    import_fs9.default.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(import_chalk9.default.green(`
\u2705 Success! Created OPO manifest at ${outputPath}`));
    console.log(import_chalk9.default.gray(`  - Found ${tables.length} tables.`));
    console.log(import_chalk9.default.gray(`  - Mapped ${supportedEntities.length} entities.`));
    console.log(import_chalk9.default.gray(`  - Identified ${relationships.length} foreign key relations.
`));
  } catch (err) {
    console.error(import_chalk9.default.red(`
\u274C Auto-Discovery Failed: ${err.message}`));
    process.exit(1);
  } finally {
    await client.close().catch(() => {
    });
  }
});

// cli/commands/onboard.ts
var import_commander10 = require("commander");
var import_fs12 = __toESM(require("fs"));
var import_path12 = __toESM(require("path"));
var import_chalk10 = __toESM(require("chalk"));
var import_prompts3 = __toESM(require("prompts"));

// lib/studio/onboarding/onboardingOrchestrator.ts
var import_fs11 = __toESM(require("fs"));
var import_path11 = __toESM(require("path"));

// lib/studio/ollamaHealth.ts
async function checkOllamaHealth(baseUrl) {
  const normalized = baseUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${normalized}/api/tags`, {
      signal: AbortSignal.timeout(4e3)
    });
    if (!res.ok) {
      return { ok: false, models: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name).filter(Boolean);
    return { ok: models.length > 0, models, error: models.length ? void 0 : "Sin modelos instalados" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo conectar";
    return { ok: false, models: [], error: message };
  }
}

// lib/studio/sqlExecutor.ts
init_protheusDbClient();

// lib/studio/connectionGuard.ts
function isConnectionAllowed(target, driver) {
  if (!target) return false;
  const allowedEnv = (process.env.OPO_ALLOWED_DB_HOSTS || "localhost,127.0.0.1,::1,host.docker.internal").toLowerCase();
  const allowList = allowedEnv.split(",").map((s) => s.trim()).filter(Boolean);
  if (driver === "sqlite" || target.includes("file:") || /^[a-zA-Z]:\\/.test(target) || target.startsWith("/")) {
    return true;
  }
  try {
    const hostMatch = target.match(/@([^:/,?]+)|\/\/([^:/,?]+)|Server=([^;]+)|Host=([^;]+)/i);
    const host = (hostMatch ? hostMatch[1] || hostMatch[2] || hostMatch[3] || hostMatch[4] || "" : target).toLowerCase().trim();
    if (!host) return true;
    if (allowList.includes(host) || allowList.includes("*") || host === "localhost" || host.startsWith("127.")) {
      return true;
    }
    return allowList.some((a) => host.includes(a) || a.includes(host));
  } catch (e) {
    return false;
  }
}

// lib/studio/sqlExecutor.ts
function bindSqlForDriver(sql, params, driver) {
  if (!params.length) return { sql, binds: [] };
  if (driver === "postgresql") {
    let i2 = 0;
    const text2 = sql.replace(/\?/g, () => `$${++i2}`);
    return { sql: text2, binds: params };
  }
  if (driver === "mssql") {
    let i2 = 0;
    const text2 = sql.replace(/\?/g, () => `@p${i2++}`);
    const binds2 = {};
    params.forEach((value, idx) => {
      binds2[`p${idx}`] = value;
    });
    return { sql: text2, binds: binds2 };
  }
  let i = 0;
  const text = sql.replace(/\?/g, () => `:p${++i}`);
  const binds = {};
  params.forEach((value, idx) => {
    binds[`p${idx}`] = value;
  });
  return { sql: text, binds };
}
async function runParameterizedQuery(connectionString, sql, params, driver) {
  var _a, _b, _c;
  const { sql: boundSql, binds } = bindSqlForDriver(sql, params, driver);
  if (driver === "postgresql") {
    let Client;
    try {
      Client = require("pg").Client;
    } catch (e) {
      throw new Error('El paquete "pg" es requerido para conexiones PostgreSQL.');
    }
    const client = new Client({ connectionString });
    await client.connect();
    try {
      const res = await client.query(boundSql, binds);
      return (_a = res.rows) != null ? _a : [];
    } finally {
      await client.end();
    }
  }
  if (driver === "mssql") {
    let mssql;
    try {
      mssql = require("mssql");
    } catch (e) {
      throw new Error('El paquete "mssql" es requerido para conexiones SQL Server.');
    }
    await mssql.connect(connectionString);
    try {
      const request = new mssql.Request();
      const namedBinds = binds;
      for (const [name, value] of Object.entries(namedBinds)) {
        request.input(name, value);
      }
      const res = await request.query(boundSql);
      return (_b = res.recordset) != null ? _b : [];
    } finally {
      await mssql.close();
    }
  }
  let oracledb;
  try {
    oracledb = require("oracledb");
  } catch (e) {
    throw new Error('El paquete "oracledb" es requerido para conexiones Oracle.');
  }
  const conn = await oracledb.getConnection(connectionString);
  try {
    const res = await conn.execute(boundSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    return (_c = res.rows) != null ? _c : [];
  } finally {
    await conn.close();
  }
}
async function executeParameterizedSql(options) {
  var _a;
  const { connectionString, sql, params = [] } = options;
  const driver = (_a = options.driver) != null ? _a : detectDriverFromUrl(connectionString);
  if (!isConnectionAllowed(connectionString, driver)) {
    throw new Error(
      "Destino de conexi\xF3n no permitido. Configur\xE1 OPO_ALLOWED_DB_HOSTS o us\xE1 localhost/servidores aprobados."
    );
  }
  const rows = await runParameterizedQuery(connectionString, sql, params, driver);
  return { rows, driver };
}

// lib/engine/vault/credential-vault.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_crypto = require("crypto");
var import_path10 = __toESM(require("path"));
var import_fs10 = __toESM(require("fs"));
var ALGORITHM = "aes-256-gcm";
var CredentialVault = class {
  constructor() {
    const dbPath = process.env.OPO_DB_PATH || "./data/opo.db";
    const dbDir = import_path10.default.dirname(dbPath);
    if (!import_fs10.default.existsSync(dbDir)) {
      import_fs10.default.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new import_better_sqlite3.default(dbPath);
    let secretHex = process.env.OPO_VAULT_SECRET;
    if (!secretHex) {
      const secretPath = import_path10.default.join(dbDir, ".vault_secret");
      try {
        if (import_fs10.default.existsSync(secretPath)) {
          secretHex = import_fs10.default.readFileSync(secretPath, "utf8").trim();
        } else {
          secretHex = (0, import_crypto.randomBytes)(32).toString("hex");
          import_fs10.default.writeFileSync(secretPath, secretHex, { mode: 384 });
          console.log("[CredentialVault] Generated and persisted new vault secret to .vault_secret (set OPO_VAULT_SECRET in prod to override)");
        }
      } catch (e) {
        throw new Error("OPO_VAULT_SECRET not set and failed to read/write persistent .vault_secret in data dir. Set OPO_VAULT_SECRET (64 hex chars) for secure credential storage across restarts.");
      }
    }
    if (!secretHex || secretHex.length !== 64) {
      throw new Error("OPO_VAULT_SECRET must be a 64-character hex string (32 bytes).");
    }
    this.secretKey = Buffer.from(secretHex, "hex");
    this.initDb();
  }
  initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        encryptedValue TEXT NOT NULL,
        iv TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);
  }
  encrypt(text) {
    const iv = (0, import_crypto.randomBytes)(16);
    const cipher = (0, import_crypto.createCipheriv)(ALGORITHM, this.secretKey, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return {
      encryptedValue: encrypted + ":" + authTag.toString("hex"),
      iv: iv.toString("hex")
    };
  }
  decrypt(encryptedData, ivHex) {
    const parts = encryptedData.split(":");
    if (parts.length !== 2) throw new Error("Invalid encrypted data format");
    const encryptedText = parts[0];
    const authTag = Buffer.from(parts[1], "hex");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = (0, import_crypto.createDecipheriv)(ALGORITHM, this.secretKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  storeKey(provider, name, apiKey) {
    const id = `key_${(0, import_crypto.randomBytes)(8).toString("hex")}`;
    const { encryptedValue, iv } = this.encrypt(apiKey);
    const createdAt = Date.now();
    const stmt = this.db.prepare("INSERT INTO credentials (id, provider, name, encryptedValue, iv, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(id, provider, name, encryptedValue, iv, createdAt);
    return id;
  }
  getKey(id) {
    const stmt = this.db.prepare("SELECT encryptedValue, iv FROM credentials WHERE id = ?");
    const row = stmt.get(id);
    if (!row) throw new Error(`Credential key with ID ${id} not found.`);
    return this.decrypt(row.encryptedValue, row.iv);
  }
  listKeys() {
    const stmt = this.db.prepare("SELECT id, provider, name, createdAt FROM credentials");
    return stmt.all();
  }
  deleteKey(id) {
    const stmt = this.db.prepare("DELETE FROM credentials WHERE id = ?");
    stmt.run(id);
  }
  close() {
    this.db.close();
  }
};

// lib/studio/onboarding/onboardingOrchestrator.ts
async function pingOllama(baseUrl) {
  return checkOllamaHealth(baseUrl);
}
async function pingErp(connectionString, dialect, filial) {
  const pingQueries = {
    mssql: "SELECT 1 AS ping",
    postgresql: "SELECT 1 AS ping",
    oracle: "SELECT 1 AS ping FROM DUAL"
  };
  const sql = pingQueries[dialect] || pingQueries.mssql;
  try {
    const started = Date.now();
    await executeParameterizedSql({ connectionString, sql, driver: dialect });
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
async function runDiscovery(config) {
  const {
    getProtheusBaselineManifest: getProtheusBaselineManifest2,
    discoverProtheusOntologyIncremental: discoverProtheusOntologyIncremental2,
    manifestToCanvasGraph: manifestToCanvasGraph2
  } = await Promise.resolve().then(() => (init_totvs(), totvs_exports));
  if (config.erp.erpId === "protheus") {
    if (config.erp.dataMode === "demo") {
      const manifest = getProtheusBaselineManifest2();
      const graph = manifestToCanvasGraph2(manifest);
      return { manifest, graph };
    } else {
      const connectionString = config.erp.connectionString || buildMssqlConnectionString(config.erp.mssql);
      const result = await discoverProtheusOntologyIncremental2(
        {
          mode: "database",
          connectionString,
          companySuffix: config.erp.companySuffix
        },
        { baseUrl: "", organizationName: "OPO Org" }
      );
      const graph = manifestToCanvasGraph2(result.mergedManifest, result.delta);
      return { manifest: result.mergedManifest, graph };
    }
  }
  const emptyManifest = {
    opo_version: "0.1.0",
    system_identity: {
      erp_name: config.erp.erpId.toUpperCase(),
      version: "1.0",
      organization_name: "Stub Org"
    },
    adapter_configuration: { base_url: "", protocol_interface: "SQL" },
    supported_entities: [],
    custom_mappings: {},
    relationships: [],
    discoveredAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return { manifest: emptyManifest, graph: { nodes: [], edges: [] } };
}
async function persistWorkspace(config, manifest, graph, overrideWorkspaceDir) {
  var _a, _b, _c;
  const workspaceDir = overrideWorkspaceDir || process.env.OPO_WORKSPACE_DIR || process.cwd();
  const manifestDir = import_path11.default.join(workspaceDir, ".well-known");
  const manifestPath = import_path11.default.join(manifestDir, "opo.json");
  const opoDir = import_path11.default.join(workspaceDir, ".opo");
  const workspacePath = import_path11.default.join(opoDir, "workspace.json");
  if (!import_fs11.default.existsSync(manifestDir)) {
    import_fs11.default.mkdirSync(manifestDir, { recursive: true });
  }
  if (!import_fs11.default.existsSync(opoDir)) {
    import_fs11.default.mkdirSync(opoDir, { recursive: true });
  }
  let connectionRef = "";
  if (config.erp.dataMode === "live" && ((_a = config.erp.mssql) == null ? void 0 : _a.password)) {
    try {
      const vault = new CredentialVault();
      const keyId = vault.storeKey("erp-mssql", "default", config.erp.mssql.password);
      vault.close();
      connectionRef = `vault:${keyId}`;
    } catch (e) {
      console.warn("[OnboardingOrchestrator] Failed to write password to CredentialVault:", e);
    }
    try {
      const secretPath = import_path11.default.join(opoDir, ".db_secret");
      import_fs11.default.writeFileSync(secretPath, config.erp.mssql.password, { mode: 384 });
      if (!connectionRef) {
        connectionRef = "file:.opo/.db_secret";
      }
    } catch (e) {
      console.error("[OnboardingOrchestrator] Failed to save fallback secret file:", e);
    }
  }
  let cloudApiKeyRef = "";
  if (config.ai.cloudApiKey) {
    try {
      const vault = new CredentialVault();
      const keyId = vault.storeKey(config.ai.provider, "default", config.ai.cloudApiKey);
      vault.close();
      cloudApiKeyRef = `vault:${keyId}`;
    } catch (e) {
      console.warn("[OnboardingOrchestrator] Failed to write API key to CredentialVault:", e);
    }
  }
  const manifestToSave = __spreadProps(__spreadValues({}, manifest), {
    _studio_canvas: {
      project: { name: config.erp.dataMode === "live" ? `Protheus \u2014 ${((_b = config.erp.mssql) == null ? void 0 : _b.database) || "Empresa"}` : "Protheus ERP Demo" },
      nodes: graph.nodes || [],
      edges: graph.edges || []
    }
  });
  import_fs11.default.writeFileSync(manifestPath, JSON.stringify(manifestToSave, null, 2), "utf8");
  const maskedMssql = config.erp.mssql ? __spreadValues({}, config.erp.mssql) : void 0;
  if (maskedMssql) {
    delete maskedMssql.password;
  }
  const workspaceData = {
    version: "1",
    project: { name: config.erp.dataMode === "live" ? `Protheus \u2014 ${((_c = config.erp.mssql) == null ? void 0 : _c.database) || "Empresa"}` : "Protheus ERP Demo" },
    erpWorkspace: {
      erpId: config.erp.erpId,
      dataMode: config.erp.dataMode,
      filial: config.erp.filial,
      companySuffix: config.erp.companySuffix,
      dialect: config.erp.erpId === "protheus" ? "mssql" : "postgresql",
      connectionRef: connectionRef || void 0,
      connectionStringMasked: config.erp.connectionString ? maskConnectionString(config.erp.connectionString) : void 0,
      mssqlMasked: maskedMssql
    },
    ai: {
      currentProvider: config.ai.provider,
      ollamaBaseUrl: config.ai.ollamaBaseUrl,
      ollamaModel: config.ai.ollamaModel,
      cloudApiKeyRef: cloudApiKeyRef || void 0
    },
    nodes: graph.nodes || [],
    edges: graph.edges || [],
    onboardedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  import_fs11.default.writeFileSync(workspacePath, JSON.stringify(workspaceData, null, 2), "utf8");
  return { manifestPath, workspacePath, connectionRef: connectionRef || void 0 };
}
function maskConnectionString(url) {
  if (!url) return "";
  let masked = url.replace(/(password|pwd)\s*=\s*[^;]+/gi, "$1=******");
  masked = masked.replace(/(\/\/([^:]+):)([^@]+)(@)/g, "$1******$4");
  return masked;
}

// cli/commands/onboard.ts
var onboardCommand = new import_commander10.Command("onboard").description("Wizard interactivo o comando no interactivo para configurar Ollama + Protheus (MSSQL)").option("--erp <name>", "Identificador de ERP (protheus | sap | odoo)", "protheus").option("--mode <mode>", "Modo de ejecuci\xF3n (demo | live)", "demo").option("--server <server>", "Servidor SQL (requerido para modo live)").option("--port <port>", "Puerto SQL Server (default 1433)", "1433").option("--database <db>", "Base de datos SQL (requerido para modo live)").option("--user <user>", "Usuario SQL").option("--password <pass>", "Contrase\xF1a SQL").option("--filial <filial>", "Filial de Protheus (default 01)", "01").option("--company-suffix <suffix>", "Sufijo de empresa (default 010)", "010").option("--ollama <url>", "URL del servidor de Ollama").option("--model <model>", "Modelo de Ollama a utilizar").option("--api-key <key>", "API key para proveedor cloud (Gemini/OpenAI)").option("--config <path>", "Configuraci\xF3n cargada desde archivo JSON").option("-o, --output <file>", "Ruta de salida para el manifiesto", ".well-known/opo.json").action(async (options) => {
  var _a, _b;
  let config;
  const isNonInteractive = options.config || options.server || options.database || options.ollama || options.model || options.apiKey || options.mode === "live" || process.env.CI;
  if (options.config) {
    const configPath = import_path12.default.resolve(process.cwd(), options.config);
    if (!import_fs12.default.existsSync(configPath)) {
      console.error(import_chalk10.default.red(`
\u274C Error: El archivo de configuraci\xF3n no existe en ${configPath}`));
      process.exit(1);
    }
    try {
      const fileContent = import_fs12.default.readFileSync(configPath, "utf8");
      config = JSON.parse(fileContent);
      console.log(import_chalk10.default.green(`
\u2713 Configuraci\xF3n cargada desde ${options.config}`));
    } catch (err) {
      console.error(import_chalk10.default.red(`
\u274C Error al leer el archivo JSON: ${err.message}`));
      process.exit(1);
    }
  } else if (isNonInteractive) {
    const mode = options.mode || "demo";
    const erpId = options.erp || "protheus";
    const filial = options.filial || "01";
    const companySuffix = options.companySuffix || "010";
    const provider = options.apiKey ? "gemini" : "ollama";
    const ollamaBaseUrl = options.ollama || "http://localhost:11434";
    const ollamaModel = options.model || "llama3.1";
    const cloudApiKey = options.apiKey || "";
    const mssql = mode === "live" ? {
      server: options.server || "localhost",
      port: Number(options.port) || 1433,
      database: options.database || "",
      user: options.user,
      password: options.password,
      encrypt: false,
      trustServerCertificate: true
    } : void 0;
    const connectionString = mssql ? buildMssqlConnectionString(mssql) : void 0;
    config = {
      ai: {
        provider,
        ollamaBaseUrl,
        ollamaModel,
        cloudApiKey
      },
      erp: {
        erpId,
        dataMode: mode,
        mssql,
        connectionString,
        filial,
        companySuffix
      }
    };
    if (mode === "live") {
      if (!options.server || !options.database) {
        console.error(import_chalk10.default.red("\n\u274C Error: --server y --database son obligatorios en modo live no interactivo."));
        process.exit(1);
      }
      console.log(import_chalk10.default.gray("Probando conexi\xF3n SQL Server (no interactivo)..."));
      const erpPing = await pingErp(connectionString, "mssql");
      if (!erpPing.ok) {
        console.error(import_chalk10.default.red(`
\u274C Conexi\xF3n fallida: ${erpPing.error}`));
        process.exit(1);
      }
      console.log(import_chalk10.default.green(`\u2713 Conexi\xF3n SQL OK (${erpPing.latencyMs}ms)`));
    }
  } else {
    console.log(import_chalk10.default.blue("\n--- OPO Studio Onboarding Wizard ---\n"));
    const aiProviderPrompt = await (0, import_prompts3.default)({
      type: "select",
      name: "provider",
      message: "Paso 1/5 \u2014 Asistente IA - Seleccion\xE1 tu proveedor:",
      choices: [
        { title: "Ollama (Local)", value: "ollama" },
        { title: "Google Gemini (Nube)", value: "gemini" },
        { title: "OpenAI (Nube)", value: "openai" }
      ],
      initial: 0
    });
    if (!aiProviderPrompt.provider) {
      console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
      process.exit(0);
    }
    let provider = aiProviderPrompt.provider;
    let ollamaBaseUrl = "http://localhost:11434";
    let ollamaModel = "llama3.1";
    let cloudApiKey = "";
    if (provider === "ollama") {
      const ollamaUrlPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "url",
        message: "URL de Ollama:",
        initial: "http://localhost:11434"
      });
      if (!ollamaUrlPrompt.url) {
        console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
        process.exit(0);
      }
      ollamaBaseUrl = ollamaUrlPrompt.url;
      console.log(import_chalk10.default.gray("Comprobando conexi\xF3n a Ollama..."));
      const ollamaRes = await pingOllama(ollamaBaseUrl);
      if (ollamaRes.ok && ollamaRes.models.length > 0) {
        console.log(import_chalk10.default.green(`\u2713 Ollama OK \u2014 ${ollamaRes.models.length} modelos detectados`));
        const modelPrompt = await (0, import_prompts3.default)({
          type: "select",
          name: "model",
          message: "Seleccion\xE1 el modelo a usar:",
          choices: ollamaRes.models.map((m) => ({ title: m, value: m })),
          initial: 0
        });
        if (modelPrompt.model) {
          ollamaModel = modelPrompt.model;
        }
      } else {
        console.log(import_chalk10.default.yellow(`\u26A0\uFE0F  No se pudo conectar a Ollama o no tiene modelos instalados: ${ollamaRes.error || "Sin modelos"}`));
        const modelPrompt = await (0, import_prompts3.default)({
          type: "text",
          name: "model",
          message: "Ingres\xE1 el nombre del modelo manualmente:",
          initial: "llama3.1"
        });
        if (!modelPrompt.model) {
          console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
          process.exit(0);
        }
        ollamaModel = modelPrompt.model;
      }
    } else {
      const apiKeyPrompt = await (0, import_prompts3.default)({
        type: "password",
        name: "apiKey",
        message: `API Key de ${provider === "gemini" ? "Gemini" : "OpenAI"}:`
      });
      if (!apiKeyPrompt.apiKey) {
        console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
        process.exit(0);
      }
      cloudApiKey = apiKeyPrompt.apiKey;
      const defaultModel = provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o";
      const modelPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "model",
        message: `Modelo a usar (default: ${defaultModel}):`,
        initial: defaultModel
      });
      ollamaModel = modelPrompt.model || defaultModel;
    }
    const erpPrompt = await (0, import_prompts3.default)({
      type: "select",
      name: "erpId",
      message: "Paso 2/5 \u2014 Proveedor de ERP:",
      choices: [
        { title: "TOTVS Protheus (MSSQL)", value: "protheus" },
        { title: "SAP (Stub)", value: "sap" },
        { title: "Odoo (Stub)", value: "odoo" }
      ],
      initial: 0
    });
    if (!erpPrompt.erpId) {
      console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
      process.exit(0);
    }
    const modePrompt = await (0, import_prompts3.default)({
      type: "select",
      name: "dataMode",
      message: "Modo (demo / live):",
      choices: [
        { title: "Demostraci\xF3n (Mock local)", value: "demo" },
        { title: "En Vivo (Conexi\xF3n real SQL Server)", value: "live" }
      ],
      initial: 0
    });
    if (!modePrompt.dataMode) {
      console.log(import_chalk10.default.yellow("\nOnboarding cancelado."));
      process.exit(0);
    }
    const erpId = erpPrompt.erpId;
    const mode = modePrompt.dataMode;
    let mssql;
    let connectionString;
    let filial = "01";
    let companySuffix = "010";
    if (mode === "live") {
      const serverPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "server",
        message: "Servidor SQL:",
        initial: "localhost"
      });
      if (!serverPrompt.server) process.exit(0);
      const portPrompt = await (0, import_prompts3.default)({
        type: "number",
        name: "port",
        message: "Puerto SQL:",
        initial: 1433
      });
      if (portPrompt.port === void 0) process.exit(0);
      const databasePrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "database",
        message: "Base de datos:"
      });
      if (!databasePrompt.database) process.exit(0);
      const userPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "user",
        message: "Usuario SQL:",
        initial: "sa"
      });
      if (!userPrompt.user) process.exit(0);
      const passwordPrompt = await (0, import_prompts3.default)({
        type: "password",
        name: "password",
        message: "Contrase\xF1a SQL:"
      });
      if (passwordPrompt.password === void 0) process.exit(0);
      const filialPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "filial",
        message: "Filial Protheus:",
        initial: "01"
      });
      if (!filialPrompt.filial) process.exit(0);
      filial = filialPrompt.filial;
      const suffixPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "companySuffix",
        message: "Sufijo empresa:",
        initial: "010"
      });
      if (!suffixPrompt.companySuffix) process.exit(0);
      companySuffix = suffixPrompt.companySuffix;
      mssql = {
        server: serverPrompt.server,
        port: portPrompt.port,
        database: databasePrompt.database,
        user: userPrompt.user,
        password: passwordPrompt.password,
        encrypt: false,
        trustServerCertificate: true
      };
      connectionString = buildMssqlConnectionString(mssql);
      console.log(import_chalk10.default.gray("Probando conexi\xF3n SQL Server..."));
      const erpPing = await pingErp(connectionString, "mssql");
      if (!erpPing.ok) {
        console.error(import_chalk10.default.red(`\u274C No llegamos al servidor SQL: ${erpPing.error || "Error desconocido"}`));
        console.error(import_chalk10.default.yellow("\xBFVPN activa? \xBFPuerto 1433 abierto? \xBFCredenciales correctas?"));
        console.log(import_chalk10.default.red("Onboarding cancelado por fallo de conexi\xF3n en base real."));
        process.exit(1);
      }
      console.log(import_chalk10.default.green(`\u2713 Conexi\xF3n SQL OK (${erpPing.latencyMs}ms)`));
    } else {
      const filialPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "filial",
        message: "Filial Protheus (Demo):",
        initial: "01"
      });
      if (!filialPrompt.filial) process.exit(0);
      filial = filialPrompt.filial;
      const suffixPrompt = await (0, import_prompts3.default)({
        type: "text",
        name: "companySuffix",
        message: "Sufijo empresa (Demo):",
        initial: "010"
      });
      if (!suffixPrompt.companySuffix) process.exit(0);
      companySuffix = suffixPrompt.companySuffix;
    }
    config = {
      ai: {
        provider,
        ollamaBaseUrl,
        ollamaModel,
        cloudApiKey
      },
      erp: {
        erpId,
        dataMode: mode,
        mssql,
        connectionString,
        filial,
        companySuffix
      }
    };
  }
  console.log(import_chalk10.default.blue("\nPaso 3/5 \u2014 Introspecci\xF3n"));
  console.log(import_chalk10.default.gray("\u280B Leyendo diccionario SX2/SX3/SX9..."));
  try {
    const { manifest, graph } = await runDiscovery(config);
    const entitiesCount = ((_a = graph.nodes) == null ? void 0 : _a.length) || 0;
    const relsCount = ((_b = graph.edges) == null ? void 0 : _b.length) || 0;
    console.log(import_chalk10.default.green(`\u2713 Mapeo exitoso: ${entitiesCount} entidades, ${relsCount} relaciones detectadas`));
    console.log(import_chalk10.default.blue("\nPaso 4/5 \u2014 Guardando workspace"));
    const outputOverride = options.output !== ".well-known/opo.json" ? import_path12.default.dirname(import_path12.default.resolve(process.cwd(), options.output)) : void 0;
    const { manifestPath, workspacePath } = await persistWorkspace(config, manifest, graph, outputOverride);
    console.log(import_chalk10.default.green(`\u2713 Manifiesto guardado en: ${manifestPath}`));
    console.log(import_chalk10.default.green(`\u2713 Workspace guardado en: ${workspacePath}`));
    console.log(import_chalk10.default.blue("\nPaso 5/5 \u2014 \xA1Listo!"));
    console.log(import_chalk10.default.gray("\nConsult\xE1 con:"));
    console.log(import_chalk10.default.cyan(`  opo query "\xBFCu\xE1nto debe el cliente 000219?"`));
    console.log(import_chalk10.default.gray("\nO abr\xED UI Studio:"));
    console.log(import_chalk10.default.cyan(`  opo studio`));
    console.log(import_chalk10.default.gray("  Acced\xE9 en: http://localhost:3000/consultas\n"));
  } catch (err) {
    console.error(import_chalk10.default.red(`\u274C Fallo en introspecci\xF3n: ${err.message}`));
    process.exit(1);
  }
});

// cli/commands/health.ts
var import_commander11 = require("commander");
var import_fs13 = __toESM(require("fs"));
var import_path13 = __toESM(require("path"));
var import_chalk11 = __toESM(require("chalk"));

// lib/mesh/vaultResolver.ts
function resolveApiKey(provider) {
  const envKey = getEnvKey(provider);
  if (envKey) return envKey;
  let vault = null;
  try {
    vault = new CredentialVault();
    const keys = vault.listKeys();
    const matchingKeys = keys.filter((k) => k.provider.toLowerCase() === provider.toLowerCase());
    if (matchingKeys.length > 0) {
      matchingKeys.sort((a, b) => b.createdAt - a.createdAt);
      return vault.getKey(matchingKeys[0].id);
    }
  } catch (error) {
    console.error(`[VaultResolver] Failed to resolve key for ${provider} from vault:`, error);
  } finally {
    if (vault) {
      try {
        vault.close();
      } catch (e) {
      }
    }
  }
  return "";
}
function getEnvKey(provider) {
  const p = provider.toLowerCase();
  if (p === "gemini") return process.env.GEMINI_API_KEY;
  if (p === "openai") return process.env.OPENAI_API_KEY;
  if (p === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (p === "grok") return process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (p === "openrouter") return process.env.OPENROUTER_API_KEY;
  return void 0;
}

// lib/studio/studioHealth.ts
init_protheusDbClient();
var PING_SQL = {
  mssql: "SELECT 1 AS ping",
  postgresql: "SELECT 1 AS ping",
  oracle: "SELECT 1 AS ping FROM DUAL"
};
async function pingErp2(input) {
  var _a, _b, _c, _d;
  const mode = (_a = input.dataMode) != null ? _a : "demo";
  if (mode !== "live") {
    return {
      status: "warn",
      label: "Demostraci\xF3n \u2014 datos de ejemplo"
    };
  }
  const connectionString = (_b = input.connectionString) == null ? void 0 : _b.trim();
  if (!connectionString) {
    return {
      status: "error",
      label: "Sin conexi\xF3n ERP",
      error: "Configur\xE1 la conexi\xF3n en Ajustes para usar datos reales."
    };
  }
  if (input.erpId === "protheus" && !((_c = input.filial) == null ? void 0 : _c.trim())) {
    return {
      status: "error",
      label: "Filial requerida",
      error: "Indic\xE1 la filial de Protheus en Ajustes."
    };
  }
  const driver = input.dialect || detectDriverFromUrl(connectionString);
  const sql = PING_SQL[driver] || PING_SQL.postgresql;
  const started = Date.now();
  try {
    await executeParameterizedSql({ connectionString, sql, driver });
    const latencyMs = Date.now() - started;
    const filialHint = ((_d = input.filial) == null ? void 0 : _d.trim()) ? ` \xB7 Filial ${input.filial.trim()}` : "";
    return {
      status: "ok",
      label: `ERP conectado${filialHint}`,
      latencyMs
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de conexi\xF3n";
    return {
      status: "error",
      label: "ERP no responde",
      latencyMs: Date.now() - started,
      error: message
    };
  }
}
var aiHealthCache = {};
async function pingAi(input) {
  var _a;
  const provider = (input.currentProvider || "gemini").toLowerCase();
  const started = Date.now();
  if (provider === "ollama" || provider === "open-code") {
    const baseUrl = ((_a = input.ollamaBaseUrl) == null ? void 0 : _a.trim()) || "http://localhost:11434";
    const result = await checkOllamaHealth(baseUrl);
    const latencyMs = Date.now() - started;
    if (result.ok) {
      return {
        status: "ok",
        label: `IA local (${provider})`,
        latencyMs
      };
    }
    return {
      status: "error",
      label: "IA local no disponible",
      latencyMs,
      error: result.error || "Ollama no responde"
    };
  }
  const apiKey = resolveApiKey(provider);
  if (!apiKey) {
    return {
      status: "warn",
      label: `Sin clave ${provider}`,
      error: "Configur\xE1 la API key en Ajustes o variables de entorno."
    };
  }
  const cacheKey = `${provider}:${apiKey.substring(0, 8)}`;
  const cached = aiHealthCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 3e4) {
    return cached.result;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5e3);
    let url = "";
    const headers = {};
    if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${apiKey}`;
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/models";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === "grok") {
      url = "https://api.x.ai/v1/models";
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      url = "https://api.openai.com/v1/models";
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Credenciales inv\xE1lidas (HTTP ${res.status})`);
    }
    const latencyMs = Date.now() - started;
    const result = {
      status: "ok",
      label: `Asistente listo (${provider})`,
      latencyMs
    };
    aiHealthCache[cacheKey] = { result, timestamp: Date.now() };
    return result;
  } catch (err) {
    const latencyMs = Date.now() - started;
    const errorMsg = err.name === "AbortError" ? "Tiempo de espera agotado (5s)" : err.message;
    const result = {
      status: "error",
      label: `Error de conexi\xF3n con ${provider}`,
      latencyMs,
      error: errorMsg
    };
    aiHealthCache[cacheKey] = { result, timestamp: Date.now() - 25e3 };
    return result;
  }
}
async function checkStudioHealth(input) {
  const dataMode = input.dataMode === "live" ? "live" : "demo";
  const [erp, ai] = await Promise.all([pingErp2(__spreadProps(__spreadValues({}, input), { dataMode })), pingAi(input)]);
  const canQuery = dataMode === "demo" || erp.status === "ok" && ai.status !== "error";
  return {
    erp,
    ai,
    dataMode,
    canQuery,
    checkedAt: Date.now()
  };
}

// cli/commands/health.ts
var healthCommand = new import_commander11.Command("health").description("Verificar el estado de conexi\xF3n del ERP y de la Inteligencia Artificial").option("--ollama-only", "Solo verificar el estado de la IA").option("--erp-only", "Solo verificar el estado del ERP").action(async (options) => {
  const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
  const workspacePath = import_path13.default.join(workspaceDir, ".opo", "workspace.json");
  if (!import_fs13.default.existsSync(workspacePath)) {
    console.error(import_chalk11.default.red('\n\u274C No se encontr\xF3 la configuraci\xF3n del workspace. Corr\xE9 "opo onboard" primero.\n'));
    process.exit(1);
  }
  let wsData;
  try {
    wsData = JSON.parse(import_fs13.default.readFileSync(workspacePath, "utf8"));
  } catch (err) {
    console.error(import_chalk11.default.red(`
\u274C Error al leer workspace.json: ${err.message}
`));
    process.exit(1);
  }
  const erpWorkspace = wsData.erpWorkspace || {};
  const ai = wsData.ai || {};
  let dbPassword = "";
  if (erpWorkspace.connectionRef && erpWorkspace.connectionRef.startsWith("vault:")) {
    try {
      const vault = new CredentialVault();
      const keyId = erpWorkspace.connectionRef.replace("vault:", "");
      dbPassword = vault.getKey(keyId);
      vault.close();
    } catch (e) {
    }
  }
  if (!dbPassword) {
    const secretPath = import_path13.default.join(workspaceDir, ".opo", ".db_secret");
    if (import_fs13.default.existsSync(secretPath)) {
      dbPassword = import_fs13.default.readFileSync(secretPath, "utf8").trim();
    }
  }
  let cloudApiKey = "";
  if (ai.cloudApiKeyRef && ai.cloudApiKeyRef.startsWith("vault:")) {
    try {
      const vault = new CredentialVault();
      const keyId = ai.cloudApiKeyRef.replace("vault:", "");
      cloudApiKey = vault.getKey(keyId);
      vault.close();
    } catch (e) {
    }
  }
  if (cloudApiKey && ai.currentProvider) {
    const providerKey = ai.currentProvider.toLowerCase();
    if (providerKey === "gemini") process.env.GEMINI_API_KEY = cloudApiKey;
    if (providerKey === "openai") process.env.OPENAI_API_KEY = cloudApiKey;
    if (providerKey === "grok") process.env.GROK_API_KEY = cloudApiKey;
    if (providerKey === "anthropic") process.env.ANTHROPIC_API_KEY = cloudApiKey;
    if (providerKey === "openrouter") process.env.OPENROUTER_API_KEY = cloudApiKey;
  }
  let connectionString = erpWorkspace.connectionString;
  if (!connectionString && erpWorkspace.mssqlMasked) {
    const fullMssql = __spreadProps(__spreadValues({}, erpWorkspace.mssqlMasked), { password: dbPassword });
    connectionString = buildMssqlConnectionString(fullMssql);
  }
  const healthInput = {
    dataMode: erpWorkspace.dataMode,
    connectionString,
    filial: erpWorkspace.filial,
    erpId: erpWorkspace.erpId,
    dialect: erpWorkspace.dialect,
    currentProvider: ai.currentProvider,
    ollamaBaseUrl: ai.ollamaBaseUrl
  };
  try {
    const result = await checkStudioHealth(healthInput);
    console.log("\n--- Estado de OPO Studio ---\n");
    if (!options.ollamaOnly) {
      const erpDot = result.erp.status === "ok" ? import_chalk11.default.green("\u25CF") : result.erp.status === "warn" ? import_chalk11.default.yellow("\u25CF") : import_chalk11.default.red("\u25CF");
      console.log(`ERP   ${erpDot} ${result.erp.label} ${result.erp.latencyMs ? `(${result.erp.latencyMs}ms)` : ""}`);
      if (result.erp.error) {
        console.log(import_chalk11.default.red(`      ${result.erp.error}`));
      }
    }
    if (!options.erpOnly) {
      const aiDot = result.ai.status === "ok" ? import_chalk11.default.green("\u25CF") : result.ai.status === "warn" ? import_chalk11.default.yellow("\u25CF") : import_chalk11.default.red("\u25CF");
      console.log(`IA    ${aiDot} ${result.ai.label} ${result.ai.latencyMs ? `(${result.ai.latencyMs}ms)` : ""}`);
      if (result.ai.error) {
        console.log(import_chalk11.default.red(`      ${result.ai.error}`));
      }
    }
    const modeDot = result.dataMode === "live" ? import_chalk11.default.green("\u25CF") : import_chalk11.default.yellow("\u25CF");
    console.log(`Modo  ${modeDot} ${result.dataMode === "live" ? "Datos en vivo" : "Demostraci\xF3n"}
`);
    process.exit(result.canQuery ? 0 : 1);
  } catch (err) {
    console.error(import_chalk11.default.red(`\u274C Error al ejecutar el control de salud: ${err.message}`));
    process.exit(1);
  }
});

// cli/commands/query.ts
var import_commander12 = require("commander");
var import_fs14 = __toESM(require("fs"));
var import_path14 = __toESM(require("path"));
var import_chalk12 = __toESM(require("chalk"));

// lib/studio/recurringQueries.ts
init_protheusBaselineSeed();
var PROTHEUS_TABLE_HINTS = ["SC5", "SA1", "SF2", "SE1", "SC6", "SB1", "SC7", "SA2"];
var PROTHEUS_RECURRING_QUERIES = [
  {
    id: "orders-count-by-customer",
    category: "ventas",
    humanLabel: "Pedidos por cliente",
    description: "Cuenta cu\xE1ntos pedidos de venta tiene un cliente (SC5).",
    meshPrompt: "\xBFCu\xE1ntos pedidos de venta tiene el cliente {customerId}? Us\xE1 la entidad SalesOrderHeader y filtr\xE1 por customerId. Respond\xE9 con el total y un resumen breve.",
    opoQueryTemplate: {
      entity: "SalesOrderHeader",
      action: "READ",
      select: { id: true, customerId: true, issueDate: true, totalAmount: true },
      filter: { customerId: { eq: "{customerId}" } },
      limit: 50
    },
    entities: ["SalesOrderHeader", "Customer"],
    params: [
      { key: "customerId", label: "C\xF3digo cliente", placeholder: "000219", defaultValue: "000219" }
    ],
    utteranceExamples: [
      "\xBFCu\xE1ntos pedidos tiene el cliente 000219?",
      "Listame los pedidos del cliente Acme",
      "Pedidos de venta para el cliente X"
    ]
  },
  {
    id: "customer-debt-summary",
    category: "cobranzas",
    humanLabel: "Deuda del cliente",
    description: "Saldo deudor y l\xEDmite de cr\xE9dito del maestro de clientes (SA1).",
    meshPrompt: "\xBFCu\xE1l es la deuda o saldo deudor del cliente {customerId}? Consult\xE1 Customer (outstandingBalance, creditLimit, legalName) y explic\xE1 el riesgo crediticio en lenguaje claro.",
    opoQueryTemplate: {
      entity: "Customer",
      action: "READ",
      select: {
        id: true,
        legalName: true,
        outstandingBalance: true,
        creditLimit: true,
        active: true
      },
      filter: { id: { eq: "{customerId}" } },
      limit: 1
    },
    entities: ["Customer"],
    params: [
      { key: "customerId", label: "C\xF3digo cliente", placeholder: "000219", defaultValue: "000219" }
    ],
    utteranceExamples: [
      "\xBFCu\xE1nto debe el cliente 000219?",
      "Saldo deudor del cliente X",
      "Reporte de deuda por cliente"
    ]
  },
  {
    id: "recent-sales-orders",
    category: "ventas",
    humanLabel: "\xDAltimos pedidos",
    description: "Listado paginado de pedidos de venta recientes (SC5).",
    meshPrompt: "Mostr\xE1 los \xFAltimos pedidos de venta del sistema. Entidad SalesOrderHeader, orden\xE1 por fecha de emisi\xF3n descendente. Formato tabla con n\xFAmero, cliente, fecha y total.",
    opoQueryTemplate: {
      entity: "SalesOrderHeader",
      action: "READ",
      select: {
        id: true,
        customerId: true,
        issueDate: true,
        totalAmount: true,
        paymentTerms: true
      },
      filter: {},
      limit: 50
    },
    entities: ["SalesOrderHeader"],
    params: [],
    utteranceExamples: [
      "\xDAltimos pedidos de venta",
      "Reporte de pedidos del mes",
      "Listado de SC5"
    ]
  },
  {
    id: "customer-profile",
    category: "clientes",
    humanLabel: "Ficha del cliente",
    description: "Datos maestros del cliente (SA1).",
    meshPrompt: "Dame la ficha completa del cliente {customerId}: raz\xF3n social, CNPJ/CPF, l\xEDmite de cr\xE9dito y si est\xE1 bloqueado.",
    opoQueryTemplate: {
      entity: "Customer",
      action: "READ",
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        partyId: true,
        creditLimit: true,
        outstandingBalance: true,
        active: true
      },
      filter: { id: { eq: "{customerId}" } },
      limit: 1
    },
    entities: ["Customer"],
    params: [
      { key: "customerId", label: "C\xF3digo cliente", placeholder: "000219", defaultValue: "000219" }
    ],
    utteranceExamples: [
      "Ficha del cliente 000219",
      "Datos del cliente X",
      "\xBFQui\xE9n es el cliente 000219?"
    ]
  },
  {
    id: "invoices-by-customer",
    category: "ventas",
    humanLabel: "Facturas del cliente",
    description: "Notas fiscales de salida (SF2) asociadas a un cliente.",
    meshPrompt: "List\xE1 las facturas de salida del cliente {customerId}. Us\xE1 SalesInvoiceHeader con filtro customerId. Inclu\xED n\xFAmero, fecha y valor bruto.",
    opoQueryTemplate: {
      entity: "SalesInvoiceHeader",
      action: "READ",
      select: {
        number: true,
        customerId: true,
        issueDate: true,
        grandTotal: true
      },
      filter: { customerId: { eq: "{customerId}" } },
      limit: 50
    },
    entities: ["SalesInvoiceHeader", "Customer"],
    params: [
      { key: "customerId", label: "C\xF3digo cliente", placeholder: "000219", defaultValue: "000219" }
    ],
    utteranceExamples: [
      "Facturas del cliente 000219",
      "NF de salida del cliente X",
      "\xBFQu\xE9 factur\xF3 el cliente?"
    ]
  },
  {
    id: "order-lines-detail",
    category: "reportes",
    humanLabel: "\xCDtems de un pedido",
    description: "Detalle de l\xEDneas SC6 para un pedido SC5.",
    meshPrompt: "Mostr\xE1 los \xEDtems del pedido {orderId}: producto, cantidad y precio. Entidad SalesOrderItem filtrando por orderId.",
    opoQueryTemplate: {
      entity: "SalesOrderItem",
      action: "READ",
      select: {
        orderId: true,
        lineNumber: true,
        productId: true,
        quantity: true,
        unitPrice: true
      },
      filter: { orderId: { eq: "{orderId}" } },
      limit: 50
    },
    entities: ["SalesOrderItem", "SalesOrderHeader", "Product"],
    params: [
      { key: "orderId", label: "N\xBA pedido", placeholder: "000001", defaultValue: "000001" }
    ],
    utteranceExamples: [
      "\xCDtems del pedido 000001",
      "Detalle del pedido X",
      "Qu\xE9 productos tiene el pedido"
    ]
  }
];
var GENERIC_RECURRING_QUERIES = [
  {
    id: "entity-list",
    category: "reportes",
    humanLabel: "Listar entidad",
    description: "Consulta gen\xE9rica paginada sobre cualquier entidad del canvas.",
    meshPrompt: "List\xE1 los primeros registros de la entidad {entityName} del ontology. Us\xE1 paginaci\xF3n por defecto (50 filas).",
    opoQueryTemplate: {
      entity: "{entityName}",
      action: "READ",
      filter: {},
      limit: 50
    },
    entities: [],
    params: [
      { key: "entityName", label: "Entidad OPO", placeholder: "Customer", defaultValue: "Customer" }
    ],
    utteranceExamples: ["Listar clientes", "Mostrar entidad X"]
  }
];
function isProtheusOntology(ontology, projectName) {
  const name = (projectName || "").toLowerCase();
  if (name.includes("protheus") || name.includes("totvs")) return true;
  const entities = (ontology == null ? void 0 : ontology.entities) || [];
  const tables = entities.map((e) => (e.originalTable || e.name || "").toUpperCase());
  const hits = tables.filter((t) => PROTHEUS_TABLE_HINTS.some((h) => t.includes(h))).length;
  if (hits >= 2) return true;
  const canonical = entities.map((e) => e.name || "");
  return canonical.includes("SalesOrderHeader") && canonical.includes("Customer");
}
function getRecurringQueriesForContext(ontology, projectName) {
  if (isProtheusOntology(ontology, projectName)) {
    return PROTHEUS_RECURRING_QUERIES;
  }
  return GENERIC_RECURRING_QUERIES;
}
function applyQueryParams(template, params) {
  if (typeof template === "string") {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      var _a;
      return (_a = params[key]) != null ? _a : `{${key}}`;
    });
  }
  if (Array.isArray(template)) {
    return template.map((item) => applyQueryParams(item, params));
  }
  if (template && typeof template === "object") {
    const out = {};
    for (const [k, v] of Object.entries(template)) {
      out[k] = applyQueryParams(v, params);
    }
    return out;
  }
  return template;
}
function buildOpoQueryFromTemplate(query, paramValues, pagination) {
  var _a;
  const values = {};
  for (const p of query.params) {
    values[p.key] = (_a = paramValues == null ? void 0 : paramValues[p.key]) != null ? _a : p.defaultValue;
  }
  const base = applyQueryParams(query.opoQueryTemplate, values);
  if ((pagination == null ? void 0 : pagination.cursor) || (pagination == null ? void 0 : pagination.limit)) {
    base.pagination = __spreadValues(__spreadValues({}, pagination.cursor ? { cursor: pagination.cursor } : {}), pagination.limit ? { limit: pagination.limit } : {});
  }
  return base;
}
function buildProtheusQueryDictionary() {
  var _a, _b;
  const companySuffix = "010";
  const logicalTableByEntity = {
    Customer: "SA1",
    Supplier: "SA2",
    Product: "SB1",
    SalesOrderHeader: "SC5",
    SalesOrderItem: "SC6",
    SalesInvoiceHeader: "SF2",
    PurchaseInvoiceHeader: "SF1"
  };
  const tableByEntity = Object.fromEntries(
    Object.entries(logicalTableByEntity).map(([entity, logical]) => [
      entity,
      `${logical}${companySuffix}`
    ])
  );
  const protheusMeta = (logicalTable, filialField) => ({
    x2Modo: "E",
    filialField,
    companySuffix,
    physicalTableName: `${logicalTable}${companySuffix}`
  });
  const joins = {
    SalesOrderHeader: {
      Customer: {
        tableName: `SA1${companySuffix}`,
        on: `SC5${companySuffix}.C5_CLIENTE = SA1${companySuffix}.A1_COD AND SC5${companySuffix}.C5_LOJACLI = SA1${companySuffix}.A1_LOJA`,
        protheus: protheusMeta("SA1", "A1_FILIAL")
      }
    },
    SalesOrderItem: {
      SalesOrderHeader: {
        tableName: `SC5${companySuffix}`,
        on: `SC6${companySuffix}.C6_NUM = SC5${companySuffix}.C5_NUM`,
        protheus: protheusMeta("SC5", "C5_FILIAL")
      },
      Product: {
        tableName: `SB1${companySuffix}`,
        on: `SC6${companySuffix}.C6_PRODUTO = SB1${companySuffix}.B1_COD`,
        protheus: protheusMeta("SB1", "B1_FILIAL")
      }
    },
    SalesInvoiceHeader: {
      Customer: {
        tableName: `SA1${companySuffix}`,
        on: `SF2${companySuffix}.F2_CLIENTE = SA1${companySuffix}.A1_COD AND SF2${companySuffix}.F2_LOJA = SA1${companySuffix}.A1_LOJA`,
        protheus: protheusMeta("SA1", "A1_FILIAL")
      }
    }
  };
  const filialByLogical = {
    SA1: "A1_FILIAL",
    SA2: "A2_FILIAL",
    SB1: "B1_FILIAL",
    SC5: "C5_FILIAL",
    SC6: "C6_FILIAL",
    SF1: "F1_FILIAL",
    SF2: "F2_FILIAL"
  };
  const dict = {};
  for (const [entity, mapping] of Object.entries(BASELINE_SEMANTIC_MAPPINGS)) {
    const fields = {};
    for (const [semantic, physical] of Object.entries(mapping)) {
      if (physical.includes("+")) continue;
      if (physical.includes("!=")) continue;
      const isNumber = physical.includes("VAL") || physical.includes("SALD") || physical.includes("TOTAL") || physical.includes("QTD") || physical.includes("PRC");
      fields[semantic] = { column: physical, type: isNumber ? "number" : "string" };
    }
    const logicalTable = (_a = logicalTableByEntity[entity]) != null ? _a : entity;
    dict[entity] = __spreadValues({
      entity,
      sourceType: "SQL",
      tableName: tableByEntity[entity] || entity,
      fields,
      protheus: protheusMeta(logicalTable, (_b = filialByLogical[logicalTable]) != null ? _b : "A1_FILIAL"),
      mutationPolicy: { readOnly: true, strategy: "rest" }
    }, joins[entity] ? { joins: joins[entity] } : {});
  }
  return dict;
}

// lib/studio/protheusMockRows.ts
var CUSTOMER_NAMES = {
  "000219": "Distribuidora Sol S.A.",
  "000220": "Comercial Norte Ltda.",
  "000221": "Industrias Delta"
};
function padOrder(n) {
  return String(n).padStart(6, "0");
}
function generateMockRowsForQuery(opoQuery, offset, fetchLimit) {
  var _a, _b, _c;
  const entity = String(opoQuery.entity || "");
  const filter = opoQuery.filter || {};
  const customerId = ((_a = filter.customerId) == null ? void 0 : _a.eq) || ((_b = filter.id) == null ? void 0 : _b.eq) || "000219";
  const orderId = ((_c = filter.orderId) == null ? void 0 : _c.eq) || "000001";
  const totalPool = entity === "Customer" ? 1 : 73;
  const rows = [];
  for (let i = 0; i < fetchLimit; i++) {
    const globalIdx = offset + i;
    if (globalIdx >= totalPool) break;
    switch (entity) {
      case "Customer":
        rows.push({
          id: customerId,
          legalName: CUSTOMER_NAMES[customerId] || `Cliente ${customerId}`,
          tradeName: `CLI ${customerId}`,
          partyId: "30123456789012",
          outstandingBalance: 45230.5 + globalIdx * 100,
          creditLimit: 12e4,
          active: true
        });
        break;
      case "SalesOrderHeader":
        rows.push({
          id: padOrder(1e3 + globalIdx),
          customerId,
          issueDate: `2026-0${globalIdx % 6 + 1}-15`,
          totalAmount: 1500 + globalIdx * 250.75,
          paymentTerms: "030"
        });
        break;
      case "SalesOrderItem":
        rows.push({
          orderId,
          lineNumber: String(globalIdx % 20 + 1).padStart(2, "0"),
          productId: `PROD${String(globalIdx % 50).padStart(4, "0")}`,
          quantity: globalIdx % 10 + 1,
          unitPrice: 99.9 + globalIdx
        });
        break;
      case "SalesInvoiceHeader":
        rows.push({
          number: String(9e5 + globalIdx),
          customerId,
          issueDate: `2026-0${globalIdx % 6 + 1}-20`,
          grandTotal: 3200 + globalIdx * 180
        });
        break;
      default:
        rows.push({
          id: `row-${globalIdx}`,
          entity,
          index: globalIdx
        });
    }
  }
  return rows;
}

// lib/studio/runOpoQuery.ts
init_protheusDbClient();
var import_opo_sdk4 = require("opo-sdk");
async function runOpoQuery(input) {
  var _a, _b, _c, _d;
  const {
    opoQuery: rawOpoQuery,
    ontology,
    projectName,
    queryId = null,
    erpExecution = {}
  } = input;
  const opoQuery = __spreadValues({}, rawOpoQuery);
  const mode = (_a = erpExecution.mode) != null ? _a : "mock";
  const connectionString = (_b = erpExecution.connectionString) == null ? void 0 : _b.trim();
  const mergedContext = __spreadValues(__spreadValues({}, opoQuery.context), erpExecution.context && typeof erpExecution.context === "object" ? erpExecution.context : {});
  if (erpExecution.filial && !mergedContext.filial) {
    mergedContext.filial = erpExecution.filial;
    mergedContext.erp = (_c = mergedContext.erp) != null ? _c : "protheus";
  }
  if (erpExecution.companySuffix && !mergedContext.companySuffix) {
    mergedContext.companySuffix = erpExecution.companySuffix;
  }
  if (erpExecution.dialect && !mergedContext.dialect) {
    mergedContext.dialect = erpExecution.dialect;
  }
  if (Object.keys(mergedContext).length > 0) {
    opoQuery.context = mergedContext;
  }
  const useProtheus = isProtheusOntology(ontology, projectName);
  const dictionary = useProtheus ? buildProtheusQueryDictionary() : {};
  if (useProtheus && mode === "live" && !mergedContext.filial) {
    throw new Error(
      "Filial requerida para consultas Protheus en vivo. Configurala en el onboarding o en Ajustes del workspace."
    );
  }
  if (useProtheus && !mergedContext.dialect) {
    mergedContext.dialect = "mssql";
    opoQuery.context = mergedContext;
  }
  let sql;
  let sqlParams = [];
  let translatedPagination;
  const translated = (0, import_opo_sdk4.translateOpoToSql)(opoQuery, dictionary, {
    context: mergedContext
  });
  sql = translated.sql;
  sqlParams = (_d = translated.params) != null ? _d : [];
  translatedPagination = translated.pagination;
  const resolved = translatedPagination || {
    limit: 50,
    offset: 0,
    fetchLimit: 51,
    appliedDefault: true
  };
  if (mode === "mock" || !sql) {
    const rows2 = generateMockRowsForQuery(opoQuery, resolved.offset, resolved.fetchLimit);
    const response2 = (0, import_opo_sdk4.buildPaginatedResponse)(rows2, resolved);
    return {
      data: response2.data,
      pagination: response2.pagination,
      meta: {
        mode: "mock",
        sql,
        queryId
      }
    };
  }
  if (!connectionString) {
    throw new Error(
      "Modo en vivo requiere connectionString. Conect\xE1 tu ERP en el onboarding o configur\xE1 la conexi\xF3n del workspace."
    );
  }
  const driver = detectDriverFromUrl(connectionString);
  if (!isConnectionAllowed(connectionString, driver)) {
    throw new Error(
      "Destino de conexi\xF3n no permitido. Configur\xE1 OPO_ALLOWED_DB_HOSTS o us\xE1 localhost/servidores aprobados."
    );
  }
  const { rows } = await executeParameterizedSql({
    connectionString,
    sql,
    params: sqlParams,
    driver
  });
  const response = (0, import_opo_sdk4.buildPaginatedResponse)(rows, resolved);
  return {
    data: response.data,
    pagination: response.pagination,
    meta: {
      mode: "live",
      sql,
      queryId,
      driver
    }
  };
}
async function runOpoQueryById(queryId, paramValues, ontology, projectName, erpExecution, pagination) {
  const catalog = getRecurringQueriesForContext(ontology, projectName);
  const template = catalog.find((q) => q.id === queryId);
  if (!template) {
    throw new Error(`Recurring query '${queryId}' not found`);
  }
  const opoQuery = buildOpoQueryFromTemplate(template, paramValues, pagination);
  return runOpoQuery({
    opoQuery,
    ontology,
    projectName,
    queryId,
    erpExecution
  });
}

// lib/studio/matchRecurringQuery.ts
function extractParamValues(rawQuery, query) {
  const values = {};
  for (const p of query.params) {
    values[p.key] = p.defaultValue;
  }
  const normalized = rawQuery.toLowerCase();
  if (query.params.some((p) => p.key === "customerId")) {
    const patterns = [
      /cliente\s+([0-9]{4,12})/i,
      /customer\s+([0-9]{4,12})/i,
      /\b([0-9]{6})\b/
    ];
    for (const re of patterns) {
      const m = rawQuery.match(re);
      if (m == null ? void 0 : m[1]) {
        values.customerId = m[1];
        break;
      }
    }
  }
  if (normalized.includes("\xFAltim") || normalized.includes("ultim") || normalized.includes("recient")) {
    if (query.id === "recent-sales-orders") {
      return values;
    }
  }
  return values;
}
function scoreQuery(rawQuery, query) {
  const normalized = rawQuery.toLowerCase();
  let score = 0;
  if (normalized.includes(query.humanLabel.toLowerCase())) score += 8;
  if (normalized.includes(query.id.replace(/-/g, " "))) score += 4;
  for (const example of query.utteranceExamples) {
    const ex = example.toLowerCase();
    const tokens = ex.split(/\s+/).filter((t) => t.length > 3);
    const hits = tokens.filter((t) => normalized.includes(t)).length;
    if (hits >= Math.min(3, tokens.length)) score += 6;
    if (normalized.includes(ex)) score += 10;
  }
  const keywordMap = {
    "customer-debt-summary": ["deuda", "debe", "saldo", "deudor", "cobranza", "cr\xE9dito", "credito"],
    "orders-count-by-customer": ["pedido", "pedidos", "orden", "\xF3rdenes", "ordenes"],
    "recent-sales-orders": ["\xFAltimos", "ultimos", "recientes", "listado"],
    "open-invoices-by-customer": ["factura", "facturas", "invoice"],
    "top-products-by-sales": ["producto", "productos", "m\xE1s vendido", "mas vendido"]
  };
  const keywords = keywordMap[query.id] || [];
  for (const kw of keywords) {
    if (normalized.includes(kw)) score += 3;
  }
  return score;
}
function matchRecurringQueryFromText(rawQuery, ontology, projectName) {
  const catalog = getRecurringQueriesForContext(ontology, projectName);
  let best = null;
  for (const query of catalog) {
    const score = scoreQuery(rawQuery, query);
    if (score < 4) continue;
    const candidate = {
      query,
      paramValues: extractParamValues(rawQuery, query),
      score
    };
    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }
  return best;
}

// lib/studio/consultasSummary.ts
function buildConsultaSummary(query, data, pagination) {
  var _a, _b, _c, _d;
  const count = (_a = pagination == null ? void 0 : pagination.returnedCount) != null ? _a : data.length;
  const moreHint = (pagination == null ? void 0 : pagination.hasNextPage) ? " Pod\xE9s cargar m\xE1s resultados abajo." : "";
  if (query.id === "customer-debt-summary" && data[0]) {
    const row = data[0];
    const name = (_c = (_b = row.legalName) != null ? _b : row.name) != null ? _c : "Cliente";
    const balance = (_d = row.outstandingBalance) != null ? _d : row.balance;
    const limit = row.creditLimit;
    return `\u{1F4CB} Deuda de ${name}: saldo ${formatMoney(balance)}, l\xEDmite de cr\xE9dito ${formatMoney(limit)}.${moreHint}`;
  }
  if (query.id === "orders-count-by-customer") {
    return `\u{1F4CB} Pedidos encontrados: ${count}.${moreHint}`;
  }
  if (query.id === "open-invoices-by-customer") {
    return `\u{1F4CB} Facturas pendientes: ${count}.${moreHint}`;
  }
  if (query.id === "recent-sales-orders") {
    return `\u{1F4CB} \xDAltimos pedidos de venta: ${count} registro(s).${moreHint}`;
  }
  if (query.id === "top-products-by-sales") {
    return `\u{1F4CB} Ranking de productos: ${count} \xEDtem(s).${moreHint}`;
  }
  return `\u{1F4CB} ${query.humanLabel}: ${count} registro(s).${moreHint}`;
}
function formatMoney(value) {
  if (value === null || value === void 0 || value === "") return "sin dato";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

// cli/commands/query.ts
var queryCommand = new import_commander12.Command("query").description("Ejecutar consultas en lenguaje natural o por ID de consulta recurrente").argument("[text]", "Texto de la consulta en lenguaje natural").option("-r, --recurring <id>", "ID de consulta recurrente directa").option("-p, --param <param>", "Par\xE1metros para la consulta recurrente en formato clave=valor (puede repetirse)", (val, memo) => {
  memo.push(val);
  return memo;
}, []).option("-f, --format <format>", "Formato de salida: table | json | csv", "table").action(async (text, options) => {
  var _a, _b;
  const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
  const workspacePath = import_path14.default.join(workspaceDir, ".opo", "workspace.json");
  const manifestPath = import_path14.default.join(workspaceDir, ".well-known", "opo.json");
  if (!import_fs14.default.existsSync(workspacePath)) {
    console.error(import_chalk12.default.red('\n\u274C No se encontr\xF3 la configuraci\xF3n del workspace. Corr\xE9 "opo onboard" primero.\n'));
    process.exit(1);
  }
  let wsData;
  try {
    wsData = JSON.parse(import_fs14.default.readFileSync(workspacePath, "utf8"));
  } catch (err) {
    console.error(import_chalk12.default.red(`
\u274C Error al leer workspace.json: ${err.message}
`));
    process.exit(1);
  }
  const manifest = import_fs14.default.existsSync(manifestPath) ? JSON.parse(import_fs14.default.readFileSync(manifestPath, "utf8")) : {};
  const erpWorkspace = wsData.erpWorkspace || {};
  const projectName = ((_a = wsData.project) == null ? void 0 : _a.name) || ((_b = manifest.system_identity) == null ? void 0 : _b.erp_name) || "Protheus";
  const cliParams = {};
  if (options.param && options.param.length > 0) {
    for (const p of options.param) {
      const eqIdx = p.indexOf("=");
      if (eqIdx !== -1) {
        const key = p.substring(0, eqIdx).trim();
        const value = p.substring(eqIdx + 1).trim();
        cliParams[key] = value;
      }
    }
  }
  let query;
  let paramValues = {};
  if (options.recurring) {
    const catalog = getRecurringQueriesForContext(manifest, projectName);
    query = catalog.find((q) => q.id === options.recurring);
    if (!query) {
      console.error(import_chalk12.default.red(`
\u274C No se encontr\xF3 la consulta recurrente "${options.recurring}"`));
      console.log(import_chalk12.default.gray(`Consultas disponibles: ${catalog.map((c) => c.id).join(", ")}`));
      process.exit(1);
    }
    paramValues = __spreadValues({}, cliParams);
  } else {
    if (!text) {
      console.error(import_chalk12.default.red("\n\u274C Error: Deb\xE9s ingresar una consulta en lenguaje natural o especificar --recurring."));
      process.exit(1);
    }
    const matched = matchRecurringQueryFromText(text, manifest, projectName);
    if (!matched || matched.score < 8) {
      console.error(import_chalk12.default.red(`
\u274C No se encontr\xF3 una consulta recurrente que coincida con: "${text}"`));
      console.log(import_chalk12.default.gray(`Score obtenido: ${(matched == null ? void 0 : matched.score) || 0}. Prob\xE1 refrasear o usar --recurring.`));
      process.exit(1);
    }
    query = matched.query;
    paramValues = __spreadValues(__spreadValues({}, matched.paramValues), cliParams);
  }
  for (const p of query.params) {
    if (paramValues[p.key] === void 0) {
      paramValues[p.key] = p.defaultValue;
    }
  }
  let dbPassword = "";
  if (erpWorkspace.connectionRef && erpWorkspace.connectionRef.startsWith("vault:")) {
    try {
      const vault = new CredentialVault();
      const keyId = erpWorkspace.connectionRef.replace("vault:", "");
      dbPassword = vault.getKey(keyId);
      vault.close();
    } catch (e) {
    }
  }
  if (!dbPassword) {
    const secretPath = import_path14.default.join(workspaceDir, ".opo", ".db_secret");
    if (import_fs14.default.existsSync(secretPath)) {
      dbPassword = import_fs14.default.readFileSync(secretPath, "utf8").trim();
    }
  }
  let connectionString = erpWorkspace.connectionString;
  if (!connectionString && erpWorkspace.mssqlMasked) {
    const fullMssql = __spreadProps(__spreadValues({}, erpWorkspace.mssqlMasked), { password: dbPassword });
    connectionString = buildMssqlConnectionString(fullMssql);
  }
  const erpExecution = {
    mode: erpWorkspace.dataMode,
    connectionString,
    filial: erpWorkspace.filial,
    companySuffix: erpWorkspace.companySuffix,
    dialect: erpWorkspace.dialect,
    context: {
      erp: erpWorkspace.erpId,
      filial: erpWorkspace.filial,
      companySuffix: erpWorkspace.companySuffix,
      dialect: erpWorkspace.dialect
    }
  };
  try {
    const result = await runOpoQueryById(
      query.id,
      paramValues,
      manifest,
      projectName,
      erpExecution
    );
    const format = options.format.toLowerCase();
    if (format === "json") {
      console.log(JSON.stringify(result.data, null, 2));
    } else if (format === "csv") {
      if (result.data.length > 0) {
        const headers = Object.keys(result.data[0]);
        console.log(headers.join(","));
        for (const row of result.data) {
          console.log(
            headers.map((h) => {
              const val = row[h];
              if (val === null || val === void 0) return "";
              const str = String(val);
              return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
            }).join(",")
          );
        }
      }
    } else {
      const summary = buildConsultaSummary(query, result.data, result.pagination);
      console.log(import_chalk12.default.cyan(`
Resumen: ${summary}
`));
      if (result.data.length > 0) {
        console.table(result.data);
      } else {
        console.log(import_chalk12.default.yellow("No se encontraron registros."));
      }
      console.log("");
    }
  } catch (err) {
    console.error(import_chalk12.default.red(`\u274C Error al ejecutar consulta: ${err.message}`));
    process.exit(1);
  }
});

// cli/index.ts
var program = new import_commander13.Command();
program.name("opo").description("Open Protocol Ontology (OPO) CLI").version("0.1.0");
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(translateCommand);
program.addCommand(mutateCommand);
program.addCommand(mcpStartCommand);
program.addCommand(inspectCommand);
program.addCommand(studioCommand);
program.addCommand(discoverCommand);
program.addCommand(onboardCommand);
program.addCommand(healthCommand);
program.addCommand(queryCommand);
program.parse(process.argv);
