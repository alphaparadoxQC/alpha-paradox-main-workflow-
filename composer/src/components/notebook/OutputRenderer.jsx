import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import InteractiveCircuitWidget from './InteractiveCircuitWidget';
import InteractiveChipWidget from './InteractiveChipWidget';

/**
 * OutputRenderer — Multiplexed output display engine.
 * Handles all Jupyter-compatible output types:
 *   - stream (stdout/stderr)
 *   - display_data (images, HTML, LaTeX)
 *   - execute_result
 *   - error (tracebacks)
 */
export default function OutputRenderer({ outputs, cellId }) {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="output-area">
      {outputs.map((output, i) => (
        <div key={i} className="output-entry">
          {renderOutput(output, cellId)}
        </div>
      ))}
    </div>
  );
}

function renderOutput(output, cellId) {
  switch (output.output_type) {
    case 'stream':
      return <StreamOutput name={output.name} text={output.text} cellId={cellId} />;
    case 'display_data':
    case 'execute_result':
      return <DisplayDataOutput data={output.data} />;
    case 'error':
      return <ErrorOutput ename={output.ename} evalue={output.evalue} traceback={output.traceback} />;
    default:
      return <pre className="output-unknown">{JSON.stringify(output, null, 2)}</pre>;
  }
}

// Robust regex to strip ANSI escape codes
function stripAnsi(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// ─── Stream Output (stdout / stderr) ─────────────────────────────────────────
function StreamOutput({ name, text, cellId }) {
  // Intercept QASM output to render Interactive Widget
  if (name === 'stdout' && text.includes('OPENQASM 2.0;')) {
    const qasmStart = text.indexOf('OPENQASM 2.0;');
    const preText = text.substring(0, qasmStart);
    const qasmText = text.substring(qasmStart);
    return (
      <>
        {preText.trim() && <pre className={`output-stream output-stream--${name}`}>{preText}</pre>}
        <InteractiveCircuitWidget cellId={cellId} qasm={qasmText} />
      </>
    );
  }

  // Intercept Alpha Metal Chip Design output to render Interactive Chip Floorplan Widget
  if (
    name === 'stdout' && (
      text.includes('Silicon layout loaded') ||
      text.includes('Silicon Chip Layout compiled') ||
      text.includes('alpha_metal') ||
      text.includes('Launching Alpha Paradox EDA') ||
      text.includes('Sent rebuild signal to Alpha Paradox EDA') ||
      text.includes('MetalGUI')
    )
  ) {
    return (
      <>
        <pre className={`output-stream output-stream--${name}`}>{stripAnsi(text)}</pre>
        <InteractiveChipWidget cellId={cellId} />
      </>
    );
  }

  return (
    <pre className={`output-stream output-stream--${name}`}>
      {stripAnsi(text)}
    </pre>
  );
}

// ─── Display Data (images, HTML, LaTeX, plain text) ──────────────────────────
function DisplayDataOutput({ data }) {
  if (!data) return null;

  // Priority order: HTML > image/svg > image/png > text/latex > text/plain
  if (data['text/html']) {
    return (
      <div
        className="output-html"
        dangerouslySetInnerHTML={{ __html: data['text/html'] }}
      />
    );
  }

  if (data['image/svg+xml']) {
    return (
      <div
        className="output-image"
        dangerouslySetInnerHTML={{ __html: data['image/svg+xml'] }}
      />
    );
  }

  if (data['image/png']) {
    return (
      <div className="output-image">
        <img
          src={`data:image/png;base64,${data['image/png']}`}
          alt="Output"
        />
      </div>
    );
  }

  if (data['text/latex']) {
    return (
      <div className="output-latex">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {data['text/latex']}
        </ReactMarkdown>
      </div>
    );
  }

  if (data['text/plain']) {
    return <pre className="output-stream output-stream--stdout">{stripAnsi(data['text/plain'])}</pre>;
  }

  return null;
}

// ─── Error Output (tracebacks) ───────────────────────────────────────────────
function ErrorOutput({ ename, evalue, traceback }) {
  // Strip ANSI escape codes for display
  const cleanTraceback = (traceback || []).map(line => stripAnsi(line));

  return (
    <div className="output-error">
      <div className="output-error__header">
        <span className="output-error__name">{stripAnsi(ename)}</span>
        <span className="output-error__separator">: </span>
        <span className="output-error__value">{stripAnsi(evalue)}</span>
      </div>
      <pre className="output-error__traceback">
        {cleanTraceback.join('\n')}
      </pre>
    </div>
  );
}
