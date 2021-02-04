function dedentTemplateLiteral({node: templateLiteral}) {
  // Where the non-whitespace content of the template literal can be
  // placed at.
  const firstValidColumn = templateLiteral.loc.start.column + 1;

  for (const templateElement of templateLiteral.quasis) {
    const lines = templateElement.value.raw.split('\n');
    // Strip the leading whitespace from every line, starting from the
    // second line. Also detect if there is a non-whitespace character
    // in the "illegal area" (the area where only whitespace is supposed
    // to be) and throw and error if there is, so that the user will
    // know they made a mistake and correct this. If we didn't do this
    // check and simply removed everything in the "illegal area", this
    // for loop would have simply been exactly equal to:
    //
    // for (let i = 1; i < lines.length; i++) {
    //   lines[i] = lines[i].slice(firstValidColumn);
    // }
    //
    // But then the user might have a hard time trying to debug their
    // program when they accidentally put a non-whitespace character in
    // the "illegal area" and expected it to appear in the output.
    //
    // It skips the first line, since the first line signifies the
    // continuation after a placeholder, or the first line of a template
    // literal.
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i],
            firstNonWhitespaceColumn = line.search(/\S/);
      // This if statement without a body is essentially a <GOTO after
      // else if>. The purpose of it is to treat a whitespace-only line
      // just like a valid line. This means, if the whitespace only line
      // is shorter than `firstValidColumn`, `slice` will trim it to
      // empty string. Otherwise, it will have whatever characters it
      // has after the `firstValidColumn`.
      if (firstNonWhitespaceColumn === -1);
      else if (firstNonWhitespaceColumn < firstValidColumn) {
        const lineNumber = templateElement.loc.start.line + i;
        throw Error(
          // +1 for columns because in text editors, first column is
          // numbered 1, whereas in Babel, it is numbered 0.
          `LINE: ${lineNumber}, COLUMN: ${firstNonWhitespaceColumn + 1}`
          + '. ' +
          `Line must start at least at column ${firstValidColumn + 1}.`
        );
      }
      lines[i] = line.slice(firstValidColumn);
    }
    templateElement.value.raw = lines.join('\n');
  }
}

module.exports = () => ({
  visitor: {
    TemplateLiteral: dedentTemplateLiteral
  }
});
