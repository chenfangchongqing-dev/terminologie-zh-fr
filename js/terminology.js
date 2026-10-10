(function (root) {
  "use strict";

  // Parse whole records: quoted fields may contain commas, quotes and newlines.
  function parseCSV(input) {
    const text = input.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], field = "", quoted = false, closed = false;
    function endField() {
      row.push(field.trim());
      field = "";
      closed = false;
    }
    function endRow() {
      endField();
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    }
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; closed = true; }
        } else { field += char; }
      } else if (char === ",") {
        endField();
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i++;
        endRow();
      } else if (char === '"') {
        if (field !== "" || closed) throw new Error("CSV: unexpected quote");
        quoted = true;
      } else {
        if (closed) throw new Error("CSV: unexpected character after closing quote");
        field += char;
      }
    }
    if (quoted) throw new Error("CSV: unterminated quoted field");
    if (field !== "" || row.length || closed) endRow();
    return rows;
  }

  function parseDataset(text, source) {
    const records = parseCSV(text);
    if (!records.length) throw new Error("CSV: missing header");
    const headers = records[0].map(value => value.toLowerCase());
    const required = ["chinois", "francais", "categorie", "registre", "definition", "note"];
    if (new Set(headers).size !== headers.length || required.some(key => !headers.includes(key))) {
      throw new Error("CSV: missing or duplicate columns");
    }
    return records.slice(1).filter(cols => !(cols.length === headers.length &&
      cols.every((value, i) => value.toLowerCase() === headers[i])))
      .map((cols, index) => {
        if (cols.length !== headers.length) {
          throw new Error(`CSV record ${index + 2}: expected ${headers.length} fields, found ${cols.length}`);
        }
        const row = Object.fromEntries(headers.map((key, i) => [key, cols[i]]));
        if (!row.chinois || !row.francais) throw new Error(`CSV record ${index + 2}: missing term`);
        return { ...row, pays: row.pays || "", reference: row.source || "", source };
      });
  }

  // Accept both keyboard apostrophes and typographic apostrophes, with or without accents.
  function normalizeSearch(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘ʼ]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function filterEntries(data, { keyword = "", source = "", category = "" } = {}) {
    const query = normalizeSearch(keyword);
    return data.filter(item =>
      (!source || item.source === source) &&
      (!category || item.categorie === category) &&
      (!query || [item.pays, item.chinois, item.francais, item.definition, item.note,
        item.equivalent_interpretation || ""].some(value => normalizeSearch(value).includes(query)))
    );
  }

  const api = { parseCSV, parseDataset, normalizeSearch, filterEntries };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Terminology = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
