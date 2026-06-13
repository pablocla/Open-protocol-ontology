'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, XCircle, FileJson, AlertTriangle } from 'lucide-react';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const SCHEMAS = [
  'Invoice', 'Customer', 'Product', 'Contract', 'CostCenter', 
  'CreditAccount', 'CreditRisk', 'DebtObligation', 'Employee', 
  'FinancialExposure', 'Guarantee', 'Inventory', 'Order', 
  'Party', 'Payment', 'PaymentBehavior', 'PriceList', 
  'Project', 'Service', 'ShipmentEvent', 'Supplier', 
  'TaxDocument', 'Warehouse', 'OpoQuery', 'OpoQueryResponse'
];

export default function ValidatorPage() {
  const [jsonInput, setJsonInput] = useState('{\n  "id": "123"\n}');
  const [selectedSchema, setSelectedSchema] = useState('Invoice');
  const [validationResult, setValidationResult] = useState<{valid: boolean, errors?: any[], message?: string} | null>(null);
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  const monacoRef = useRef<any>(null);

  // Fetch the active schema for Ajv validation
  useEffect(() => {
    async function fetchSchema() {
      setLoadingSchema(true);
      try {
        const res = await fetch(`/schemas/${selectedSchema}.json`);
        if (res.ok) {
          const data = await res.json();
          setSchemaData(data);
          setValidationResult(null); // Reset on schema change
        } else {
          console.error('Failed to load schema');
          setSchemaData(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSchema(false);
      }
    }
    fetchSchema();
  }, [selectedSchema]);

  // Inject schema into Monaco Editor dynamically whenever the schema changes
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current;
      
      // Update the JSON language service with the new schema URI
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [{
          uri: `https://openprotocol.dev/schemas/${selectedSchema}.json`, // Fake absolute URI needed by Monaco
          fileMatch: ['*'], // Match all files in this editor instance
          schema: schemaData // Pass the actual downloaded schema object
        }]
      });
    }
  }, [schemaData, selectedSchema]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;
    // Initial injection if schema is already loaded
    if (schemaData) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [{
          uri: `https://openprotocol.dev/schemas/${selectedSchema}.json`,
          fileMatch: ['*'],
          schema: schemaData
        }]
      });
    }
  };

  const handleValidate = () => {
    if (!schemaData) return;

    try {
      const data = JSON.parse(jsonInput);
      const ajv = new Ajv({ strict: false, allErrors: true });
      addFormats(ajv);

      const validate = ajv.compile(schemaData);
      const valid = validate(data);

      if (valid) {
        setValidationResult({ valid: true });
      } else {
        setValidationResult({ valid: false, errors: validate.errors || [] });
      }
    } catch (e: any) {
      setValidationResult({ valid: false, message: 'Invalid JSON format: ' + e.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10 flex flex-col h-full min-h-screen">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <FileJson className="text-emerald-500" />
          OPO Web Validator
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm">
          Select an OPO Schema. The editor provides real-time IntelliSense and strict validation against the Draft 2020-12 JSON Schema specification. Powered by Monaco Editor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        <div className="lg:col-span-2 flex flex-col space-y-4 h-full">
          <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800 shrink-0">
            <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Target Schema:</label>
            <select 
              value={selectedSchema} 
              onChange={(e) => setSelectedSchema(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {SCHEMAS.map(s => <option key={s} value={s}>{s}.json</option>)}
            </select>
            <button 
              onClick={handleValidate}
              disabled={loadingSchema}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              AJV Validate
            </button>
          </div>

          <div className="relative flex-1 border border-slate-800 rounded-lg overflow-hidden bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonInput}
              onChange={(val) => setJsonInput(val || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                formatOnPaste: true,
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-1 h-full">
          <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-5 h-full overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Ajv Validation Results
            </h2>

            {!validationResult && (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm italic text-center">
                <FileJson className="h-8 w-8 mb-2 opacity-20" />
                Live linting is active in the editor. Click "AJV Validate" for a full structural report.
              </div>
            )}

            {validationResult?.valid === true && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Valid Payload
                </div>
                <p className="text-xs text-emerald-500/80">
                  This JSON perfectly matches the OPO {selectedSchema} schema. AI Agents will understand this payload without hallucinations.
                </p>
              </div>
            )}

            {validationResult?.valid === false && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-3">
                  {validationResult.message ? <AlertTriangle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  Validation Failed
                </div>
                
                {validationResult.message ? (
                  <p className="text-xs text-red-400/80 font-mono bg-black/40 p-2 rounded">
                    {validationResult.message}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {validationResult.errors?.map((err, i) => (
                      <li key={i} className="text-xs font-mono text-red-300/80 bg-black/30 p-2 rounded border border-red-900/30">
                        <span className="text-red-400 font-bold mr-1">
                          {err.instancePath || 'root'}
                        </span>
                        {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
