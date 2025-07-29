document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('barcodeForm');
    const barcodeType = document.getElementById('barcodeType');
    const barcodeData = document.getElementById('barcodeData');
    const companyName = document.getElementById('companyName');
    const barcodeWidth = document.getElementById('barcodeWidth');
    const barcodeHeight = document.getElementById('barcodeHeight');
    const fontSize = document.getElementById('fontSize');
    const showText = document.getElementById('showText');
    const barcodeContainer = document.getElementById('barcode');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        generateBarcode();
    });
    
    // Generate initial barcode when page loads
    generateBarcode();
    
    function generateBarcode() {
        const data = barcodeData.value || 'EXAMPLE123';
        const type = barcodeType.value;
        const width = parseFloat(barcodeWidth.value);
        const height = parseFloat(barcodeHeight.value);
        const textSize = parseInt(fontSize.value);
        const displayText = showText.checked;
        const company = companyName.value;
        
        // Convert mm to pixels (approx 3.78 px per mm)
        const widthPx = width * 3.78;
        const heightPx = height * 3.78;
        
        // Clear previous barcode
        barcodeContainer.innerHTML = '';
        qrCodeContainer.innerHTML = '';
        qrCodeContainer.style.display = 'none';
        
        if (type === 'QR') {
            barcodeContainer.style.display = 'none';
            qrCodeContainer.style.display = 'block';
            
            QRCode.toCanvas(qrCodeContainer, data, {
                width: widthPx,
                margin: 2,
                color: {
                    dark: '#000',
                    light: '#fff'
                }
            }, function(error) {
                if (error) console.error(error);
            });
        } else {
            barcodeContainer.style.display = 'block';
            
            JsBarcode(barcodeContainer, data, {
                format: type,
                width: widthPx / 100,
                height: heightPx,
                displayValue: displayText,
                fontSize: textSize,
                margin: 10,
                lineColor: '#000',
                background: '#fff'
            });
        }
        
        // Display company name if provided
        if (company) {
            companyNameDisplay.textContent = company;
            companyNameDisplay.style.fontSize = `${textSize}px`;
            companyNameDisplay.style.display = 'block';
        } else {
            companyNameDisplay.style.display = 'none';
        }
        
        // Enable download and print buttons
        downloadBtn.disabled = false;
        printBtn.disabled = false;
    }
    
    // Download functionality
    downloadBtn.addEventListener('click', function() {
        const type = barcodeType.value;
        let canvas;
        
        if (type === 'QR') {
            canvas = qrCodeContainer.querySelector('canvas');
        } else {
            // Create a canvas from SVG for non-QR codes
            const svg = barcodeContainer.querySelector('svg');
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(svg);
            
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Add company name to canvas if exists
                if (companyName.value) {
                    ctx.font = `${fontSize.value}px Arial`;
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.fillText(companyName.value, canvas.width/2, canvas.height - 10);
                }
                
                downloadCanvas(canvas);
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
            return;
        }
        
        // For QR codes
        if (companyName.value) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height + 30; // Extra space for text
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw QR code
            tempCtx.drawImage(canvas, 0, 0);
            
            // Add company name
            tempCtx.font = `${fontSize.value}px Arial`;
            tempCtx.fillStyle = '#000';
            tempCtx.textAlign = 'center';
            tempCtx.fillText(companyName.value, tempCanvas.width/2, tempCanvas.height - 10);
            
            canvas = tempCanvas;
        }
        
        downloadCanvas(canvas);
    });
    
    function downloadCanvas(canvas) {
        const link = document.createElement('a');
        link.download = `barcode-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    // Print functionality
    printBtn.addEventListener('click', function() {
        const type = barcodeType.value;
        let printContent;
        
        if (type === 'QR') {
            printContent = qrCodeContainer.innerHTML;
        } else {
            printContent = barcodeContainer.innerHTML;
        }
        
        if (companyName.value) {
            printContent += `<div style="text-align:center; font-size:${fontSize.value}px; font-family:Arial; margin-top:10px;">${companyName.value}</div>`;
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcode</title>
                <style>
                    body { text-align:center; padding:20px; }
                    svg, canvas { max-width:100%; height:auto; }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });
    
    // Make all form controls trigger regeneration when changed
    const controls = [barcodeType, barcodeData, companyName, barcodeWidth, barcodeHeight, fontSize, showText];
    controls.forEach(control => {
        control.addEventListener('change', generateBarcode);
        control.addEventListener('input', generateBarcode);
    });
});
