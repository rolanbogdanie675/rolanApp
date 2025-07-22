function filterDiffByFilePath(diff, regex) {
  return diff
    .split(`diff --git`).slice(1)
    .map(block => block.trim())
    .filter(block => {
      const paths = block.split('\n')[0].trim().split(' ').map(path => path.substring(2));
      return paths.some(path => regex.test(path));
    })
    .map(block => `diff --git ${block}`)
    .join('\n');
}

function restrictedFilePresent(diff, regex) {
  return diff
    .split(`diff --git`).slice(1)
    .some(block => {
      const paths = block.split('\n')[0].trim().split(' ').map(path => path.substring(2));
      return paths.some(path => regex.test(path));
    });
}

function filterDiffLineAdditions(diff) {
  return diff.split('\n').filter(line => line.trim().startsWith('+') && !line.trim().startsWith('+++')).join('/n');
}

function filterDiffFileCreations(diff) {
  return diff
    .split(`diff --git`).slice(1)
    .filter(block => block.includes('new file mode')) 
    .map((block) => `diff --git ${block}`) 
    .join('\n'); 
}

function hasNumberOfCodeBlocksIncreased (diffFragment, codeBlocks) {
  const codeBlockFound = {}; 
  codeBlocks.forEach((codeBlock)=> codeBlockFound[codeBlock] = false);

  diffFragment.split('\n').forEach((line)=> { 
    codeBlocks.forEach((codeBlock)=>  {
      if (line.includes (codeBlock))  codeBlockFound[codeBlock] = true;
   }); 
  });

  return codeBlockFound; 
} 
