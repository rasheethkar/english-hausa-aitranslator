import dotenv from 'dotenv';
import { translateToHausa, getProviderStatus } from '../src/server/translator.ts';

dotenv.config();

async function runSmokeTest() {
  const status = getProviderStatus();
  console.log(`\n==================================================`);
  console.log(`🚀 Starting Gemma 4 Hausa Translation Smoke Test`);
  console.log(`--------------------------------------------------`);
  console.log(`Provider : ${status.activeProvider.toUpperCase()}`);
  console.log(`Model    : ${status.activeProvider === 'local' ? status.ollamaModel : status.apiModel}`);
  console.log(`Endpoint : ${status.activeProvider === 'local' ? status.ollamaBaseUrl : 'Google AI Studio API'}`);
  console.log(`==================================================\n`);

  // Realistic sample input capturing greeting, etiquette, and family well-being
  const realisticInput = 'Good morning! How did you sleep? I hope you and your family are in good health. May God grant us peace.';

  console.log(`[Input]: "${realisticInput}"\n`);
  console.log(`Sending to ${status.activeProvider.toUpperCase()} provider...`);

  try {
    const startTime = Date.now();
    const result = await translateToHausa(realisticInput, {
      tonePreference: 'Respectful & Polite',
      targetAudience: 'Hausa Host & Family',
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\nResponse received in ${duration}s!`);
    console.log(`[Hausa (Boko)]: ${result.hausaTranslation}`);
    console.log(`[Pronunciation]: ${result.pronunciationGuide}`);
    console.log(`[Tone & Register]: ${result.toneAndRegister}`);
    if (result.regionalVariants?.length) {
      console.log(`[Regional Variants]:`);
      result.regionalVariants.forEach((v) => {
        console.log(`  - ${v.dialect}: "${v.phrase}" (${v.note})`);
      });
    }
    if (result.culturalNotes) {
      console.log(`[Cultural Notes]: ${result.culturalNotes}`);
    }

    // Validation checks
    const hasTranslation = typeof result.hausaTranslation === 'string' && result.hausaTranslation.trim().length > 5;
    const providerMatches = result.providerUsed === status.activeProvider;

    if (!hasTranslation) {
      throw new Error('Smoke test failed: hausaTranslation is empty or too short.');
    }

    if (!providerMatches) {
      throw new Error(`Smoke test failed: provider mismatch. Expected ${status.activeProvider}, got ${result.providerUsed}`);
    }

    console.log(`\n==================================================`);
    console.log(`✅ GEMMA 4 TRANSLATION SMOKE TEST: PASS`);
    console.log(`==================================================`);
    console.log(`PASS`);
    process.exit(0);
  } catch (error: any) {
    console.error(`\n==================================================`);
    console.error(`❌ GEMMA 4 TRANSLATION SMOKE TEST: FAIL`);
    console.error(`Reason: ${error?.message || error}`);
    console.error(`==================================================`);
    console.log(`FAIL`);
    process.exit(1);
  }
}

runSmokeTest();
