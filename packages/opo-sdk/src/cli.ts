#!/usr/bin/env node
import prompts from 'prompts';
import * as fs from 'fs';
import * as path from 'path';
import { OpoOntologyBuilder } from './builder';

async function main() {
  console.log('🤖 Bienvenue al Generador de Ontologías de OPO (Open Protocol Ontology)\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'entity',
      message: '¿Cual es el nombre de la Entidad Canónica? (Ej. Invoice, Customer)',
      validate: value => value.length > 0 ? true : 'Debe ingresar una entidad'
    },
    {
      type: 'select',
      name: 'sourceType',
      message: '¿Qué tipo de origen de datos utilizarás?',
      choices: [
        { title: 'SQL (Base de datos relacional)', value: 'SQL' },
        { title: 'REST (API Endpoint)', value: 'REST' },
        { title: 'GraphQL (Mutación o Query)', value: 'GraphQL' }
      ],
      initial: 0
    },
    {
      type: 'text',
      name: 'tableName',
      message: '¿Cuál es el nombre de la tabla o endpoint físico en tu infraestructura? (Ej. VBRK, account_move)',
      validate: value => value.length > 0 ? true : 'Requerido'
    },
    {
      type: 'text',
      name: 'description',
      message: 'Escribe una breve descripción para este mapeo (Opcional):'
    }
  ]);

  if (!response.entity || !response.sourceType || !response.tableName) {
    console.log('Operación cancelada.');
    process.exit(1);
  }

  const builder = new OpoOntologyBuilder()
    .setEntity(response.entity)
    .setSource(response.sourceType, response.tableName);

  if (response.description) {
    builder.setDescription(response.description);
  }

  console.log(`\nVamos a mapear los campos de la entidad ${response.entity}.`);
  let addMore = true;

  while (addMore) {
    const fieldRes = await prompts([
      {
        type: 'text',
        name: 'canonicalName',
        message: 'Nombre del campo en OPO (Ej. id, totalAmount):'
      },
      {
        type: 'text',
        name: 'physicalColumn',
        message: 'Columna física en tu base de datos (Ej. VBELN):'
      },
      {
        type: 'select',
        name: 'type',
        message: 'Tipo de dato:',
        choices: [
          { title: 'string', value: 'string' },
          { title: 'number', value: 'number' },
          { title: 'boolean', value: 'boolean' }
        ]
      },
      {
        type: 'confirm',
        name: 'addAnother',
        message: '¿Agregar otro campo?',
        initial: true
      }
    ]);

    if (!fieldRes.canonicalName) break;

    builder.addField(fieldRes.canonicalName, fieldRes.physicalColumn, fieldRes.type);
    addMore = fieldRes.addAnother;
  }

  const resultJSON = builder.build();
  const outputPath = path.join(process.cwd(), `${response.entity}.json`);
  
  fs.writeFileSync(outputPath, JSON.stringify(resultJSON, null, 2), 'utf8');
  console.log(`\n✨ ¡Éxito! Tu archivo OPO Mapping ha sido generado en:`);
  console.log(`📂 ${outputPath}`);
  console.log(`Súbelo a tu registro o publícalo en /.well-known/opo.json`);
}

main().catch(err => {
  console.error('Error in CLI:', err);
});
