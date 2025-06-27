import { execSync } from 'child_process';

console.log('🔍 Debug Scanner Output');

try {
    const output = execSync(
        'node basarometer-scanner.js --test --site rami-levy',
        { 
            encoding: 'utf-8',
            timeout: 120000,
            cwd: process.cwd()
        }
    );
    
    console.log('📄 Raw Output:');
    console.log(output);
    
    console.log('\n🔍 Looking for patterns:');
    console.log('Found numbers:', output.match(/\\d+/g));
    console.log('Found בשר:', output.includes('בשר'));
    console.log('Found מוצרי:', output.includes('מוצרי'));
    
    const lines = output.split('\n');
    console.log('\n📋 Lines containing numbers:');
    lines.forEach((line, index) => {
        if (/\\d+/.test(line) && line.includes('מוצר')) {
            console.log(`Line ${index}: ${line}`);
        }
    });
    
} catch (error) {
    console.error('Error:', error.message);
}