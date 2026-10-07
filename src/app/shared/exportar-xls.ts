import * as XLSX from 'xlsx';

/**
 * Exporta linhas para .xls direto no navegador, sem passar pela API.
 *
 * As chaves de cada linha viram o cabeçalho, na ordem em que aparecem. Valores
 * nulos saem em branco.
 */
export function exportarXls(nomeArquivo: string, linhas: Record<string, unknown>[]): void {
  const planilha = XLSX.utils.json_to_sheet(
    linhas.map(linha =>
      Object.fromEntries(
        Object.entries(linha).map(([chave, valor]) => [chave, valor ?? ''])
      )
    )
  );

  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, 'Relatório');
  XLSX.writeFile(livro, nomeArquivo.endsWith('.xls') ? nomeArquivo : `${nomeArquivo}.xls`);
}
