import '../../shared/lib/promise-with-resolvers';

let scriptsLoadInitiated = false;
const { chrome } = globalThis;
const testMode = process.env.IN_TEST;

globalThis.stateHooks = globalThis.stateHooks || {};

const loadTimeLogs = [];

function tryImport(...fileNames) {
  try {
    const startTime = Date.now();
    importScripts(...fileNames);
    const endTime = Date.now();
    loadTimeLogs.push({
      name: fileNames,
      value: endTime - startTime,
      children: [],
      startTime,
      endTime,
    });
    return true;
  } catch (e) {
    console.error(e);
  }
  return false;
}

function importAllScripts() {
  if (scriptsLoadInitiated) return;
  scriptsLoadInitiated = true;

  const files = [];
  const loadFile = (fileName) => {
    if (testMode) tryImport(fileName);
    else files.push(fileName);
  };

  const startImportScriptsTime = Date.now();

  const useSnow = process.env.USE_SNOW;
  if (typeof useSnow !== 'boolean') throw new Error('Missing USE_SNOW environment variable');

  const applyLavaMoat = process.env.APPLY_LAVAMOAT;
  if (typeof applyLavaMoat !== 'boolean') throw new Error('Missing APPLY_LAVAMOAT environment variable');

  loadFile('../scripts/sentry-install.js');

  if (useSnow && !self.document) { // isWorker check simplified
  	// skip loading snow.js in worker context
	} else if(useSnow){
	  loadFile('../scripts/snow.js');
	}
	if(useSnow){
	  loadFile('../scripts/use-snow.js');
	}

	if (testMode || applyLavaMoat) {
	  ['../scripts/runtime-lavamoat.js', '../scripts/lockdown-more.js', '../scripts/policy-load.js'].forEach(loadFile);
	} else {
	  ['../scripts/init-globals.js', '../scripts/lockdown-install.js', '../scripts/lockdown-run.js', '../scripts/lockdown-more.js', '../scripts/runtime-cjs.js'].forEach(loadFile);
	}

	const rawFileList = process.env.FILE_NAMES || '';
	rawFileList.split(',').filter(Boolean).forEach(loadFile);

	tryImport(...files);

	const endImportScriptsTime=Date.now();

	console.log(`SCRIPTS IMPORT COMPLETE in Seconds: ${(endImportScriptsTime - startImportScriptsTime)/1000}`);

	if(testMode){
	  console.log(`Time for each import: ${JSON.stringify({
	    name:'Total',
	    children:loadTimeLogs,
	    startTime:startImportScriptsTime,
	    endTime:endImportScriptsTime,
	    value:endImportScriptsTim -startImportScriptsTim,
	    version:1
	  },null,4)}`);
	}
}

self.addEventListener('install', importAllScripts);

chrome.runtime.onMessage.addListener(() => { importAllScripts(); return false; });

if(self.serviceWorker.state==='activated'){importAllScripts();}

const registerInPageContentScript=async()=>{
	try{
	   await chrome.scripting.registerContentScripts([{
	     id:'inpage',
	     matches:['file://*/*','http://*/*','https://*/*'],
	     js:['scripts/inpage.js'],
	     runAt:'document_start',
	     world:'MAIN',
	     allFrames:true
	   }]);
	}catch(err){
	   console.warn(`Dropped attempt to register inpage content script. ${err}`);
   }
};

const deferredOnInstalledListener=Promise.withResolvers();
globalThis.stateHooks.onInstalledListener=deferredOnInstalledListener.promise;

chrome.runtime.onInstalled.addListener(function listener(details){
	chrome.runtime.onInstalled.removeListener(listener);
	deferredOnInstalledListener.resolve(details);
	delete globalThis.stateHooks.onInstalledListener;
});

registerInPageContentScript();
