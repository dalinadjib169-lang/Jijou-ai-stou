const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/MathFunctionSection.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace any corrupted unicode sequence if tsc reports it's binary
// We will look for the first askDaliDialogue return block and slice out any corrupted leftovers
const marker = "setIsDialogueLoading(false);\n    }\n  };";
const firstIdx = content.indexOf(marker);

if (firstIdx !== -1) {
  const secondIdx = content.indexOf(marker, firstIdx + marker.length);
  if (secondIdx !== -1) {
    console.log("Found both occurrences of dialogue end block. Slicing out the corrupted clone in the middle...");
    const beforeSection = content.substring(0, firstIdx + marker.length);
    const afterSection = content.substring(secondIdx + marker.length);
    fs.writeFileSync(filePath, beforeSection + "\n" + afterSection, 'utf8');
    console.log("File successfully saved and cleaned!");
  } else {
    console.log("Could not find second end block. Trying regex fallback replacement...");
    const cleaned = content.replace(/\};\s*[\s\S]+?setIsDialogueLoading\(false\);\s*\}\s*\};/m, "};\n");
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log("Regex fallback cleaning completed!");
  }
} else {
  console.log("Marker end block not found. Cleaning any generic non-UTF8 binary characters...");
  // Strip null bytes and common corruption symbols
  const cleaned = content.replace(/\uFFFD/g, "");
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log("Generic replacement character cleaning completed!");
}
