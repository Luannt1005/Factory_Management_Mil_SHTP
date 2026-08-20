const fs = require('fs');

const files = [
    'c:/Users/luan.nguyen/Desktop/test org/Orgchart_TTI_onprem/src/app/visitordashboard/page.tsx',
    'c:/Users/luan.nguyen/Desktop/test org/Orgchart_TTI_onprem/src/app/visitoradmin/page.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace .toLocaleDateString('vi-VN') with .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    content = content.replace(/\.toLocaleDateString\('vi-VN'\)/g, ".toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })");
    
    // Replace .toLocaleDateString() with .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    // Careful: might match other things. Let's use specific regex.
    content = content.replace(/\.toLocaleDateString\(\)/g, ".toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })");

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}
