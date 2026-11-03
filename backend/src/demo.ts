import { fetchStockCandles } from './services/marketDataService';
import { analyzeStockCandles } from './services/patternEngine';

async function runDemo() {
  const args = process.argv.slice(2);
  const scanMode = args.includes('--scan');

  const symbolsToScan = scanMode
    ? ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'AMD', 'META', 'GOOGL', 'RELIANCE.NS', 'TCS.NS']
    : [args[0] || 'NVDA'];

  console.log('='.repeat(65));
  console.log('🎯 BullsEye: Automated Breakout Pattern Detection Engine');
  console.log('='.repeat(65));

  for (const symbol of symbolsToScan) {
    try {
      console.log(`\n⏳ Fetching OHLCV data for ${symbol}...`);
      const candles = await fetchStockCandles(symbol, '6mo', '1d');

      console.log(`📊 Loaded ${candles.length} candles (Latest Date: ${candles[candles.length - 1]?.dateStr})`);

      const scanResult = analyzeStockCandles(symbol, candles);

      console.log(`🔍 Swing Points Detected: ${scanResult.highPivotsCount} Highs, ${scanResult.lowPivotsCount} Lows`);
      console.log(`💰 Latest Price: $${scanResult.latestPrice.toFixed(2)}`);

      if (!scanResult.hasPattern || !scanResult.pattern) {
        console.log(`⚪ No active triangle or box pattern identified at this time.`);
        continue;
      }

      const p = scanResult.pattern;
      console.log(`\n✨ [PATTERN DETECTED] ✨`);
      console.log(`   🏷️  Pattern Type:      ${p.patternType}`);
      console.log(`   🧭 Direction:         ${p.direction}`);
      console.log(`   ⭐ Confidence Score:  ${p.confidenceScore}%`);
      console.log(`   ⚡ Current Status:     ${p.status}`);
      console.log(`   🎯 Breakout Level:    $${p.breakoutLevel}`);
      console.log(`   🛡️  Support Level:     $${p.supportLevel}`);
      console.log(`   📏 Proximity to Break: ${p.proximityPercent}%`);
      console.log(`   📈 Volume Multiplier:  ${p.volumeMultiplier}x 20-SMA ${p.hasVolumeSurge ? '🔥 [SURGE]' : ''}`);
      console.log(`   📐 Upper Line:        slope=${p.upperLine.slope.toFixed(4)}, R²=${p.upperLine.rSquared.toFixed(3)}`);
      console.log(`   📐 Lower Line:        slope=${p.lowerLine.slope.toFixed(4)}, R²=${p.lowerLine.rSquared.toFixed(3)}`);
      if (p.apexIndex) {
        console.log(`   ⏳ Projected Apex:    Candle Index ~${Math.round(p.apexIndex)}`);
      }
    } catch (err: any) {
      console.error(`❌ Error scanning ${symbol}:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(65));
  console.log('✅ Analysis complete.');
}

runDemo();

