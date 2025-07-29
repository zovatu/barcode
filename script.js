document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('barcodeForm');
    const barcodeType = document.getElementById('barcodeType');
    const barcodeData = document.getElementById('barcodeData');
    const companyName = document.getElementById('companyName');
    const barcodeWidth = document.getElementById('barcodeWidth');
    const barcodeHeight = document.getElementById('barcodeHeight');
    const fontSize = document.getElementById('fontSize');
    const showText = document.getElementById('showText');
    const barcodeColor = document.getElementById('barcodeColor');
    const barcodeContainer = document.getElementById('barcode');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    // Initialize with default barcode
    generateBarcode();
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        generateBarcode();
    });
    
    // Generate barcode function
    function generateBarcode() {
        const data = barcodeData.value || 'BARCODE123';
        const type = barcodeType.value;
        const width = parseFloat(barcodeWidth.value);
        const height = parseFloat(barcodeHeight.value);
        const textSize = parseInt(fontSize.value);
        const displayText = showText.checked;
        const company = companyName.value;
        const color = barcodeColor.value;
        
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
                    dark: color,
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) console.error(error);
                enableButtons();
            });
        } else if (type === 'DATAMATRIX' || type === 'PDF417') {
            // These formats require special handling
            barcodeContainer.style.display = 'block';
            try {
                JsBarcode(barcodeContainer, data, {
                    format: type,
                    width: widthPx / 100,
                    height: heightPx,
                    displayValue: displayText,
                    fontSize: textSize,
                    margin: 10,
                    lineColor: color,
                    background: '#ffffff'
                });
                enableButtons();
            } catch (e) {
                console.error("Error generating barcode:", e);
                barcodeContainer.innerHTML = '<p class="text-danger">Error: Invalid data for selected barcode type</p>';
                disableButtons();
            }
        } else {
            barcodeContainer.style.display = 'block';
            
            JsBarcode(barcodeContainer, data, {
                format: type,
                width: widthPx / 100,
                height: heightPx,
                displayValue: displayText,
                fontSize: textSize,
                margin: 10,
                lineColor: color,
                background: '#ffffff'
            });
            enableButtons();
        }
        
        // Display company name if provided
        if (company) {
            companyNameDisplay.textContent = company;
            companyNameDisplay.style.fontSize = `${textSize}px`;
            companyNameDisplay.style.display = 'block';
        } else {
            companyNameDisplay.style.display = 'none';
        }
    }
    
    // Enable action buttons
    function enableButtons() {
        downloadBtn.disabled = false;
        printBtn.disabled = false;
        copyBtn.disabled = false;
    }
    
    // Disable action buttons
    function disableButtons() {
        downloadBtn.disabled = true;
        printBtn.disabled = true;
        copyBtn.disabled = true;
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
            canvas = svgToCanvas(svg);
        }
        
        // Add company name to canvas if exists
        if (companyName.value) {
            canvas = addTextToCanvas(canvas, companyName.value, fontSize.value);
        }
        
        downloadCanvas(canvas);
    });
    
    // SVG to Canvas conversion
    function svgToCanvas(svg) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise(resolve => {
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
        });
    }
    
    // Add text to canvas
    function addTextToCanvas(canvas, text, fontSize) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height + parseInt(fontSize) + 20; // Extra space for text
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw original image
        tempCtx.drawImage(canvas, 0, 0);
        
        // Add text
        tempCtx.font = `bold ${fontSize}px Arial`;
        tempCtx.fillStyle = barcodeColor.value;
        tempCtx.textAlign = 'center';
        tempCtx.fillText(text, tempCanvas.width/2, tempCanvas.height - 10);
        
        return tempCanvas;
    }
    
    // Download canvas as PNG
    function downloadCanvas(canvas) {
        const link = document.createElement('a');
        link.download = `barcode-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    // Print functionality
    printBtn.addEventListener('click', async function() {
        const type = barcodeType.value;
        let canvas;
        
        if (type === 'QR') {
            canvas = qrCodeContainer.querySelector('canvas');
        } else {
            const svg = barcodeContainer.querySelector('svg');
            canvas = await svgToCanvas(svg);
        }
        
        if (companyName.value) {
            canvas = addTextToCanvas(canvas, companyName.value, fontSize.value);
        }
        
        printCanvas(canvas);
    });
    
    // Print canvas
    function printCanvas(canvas) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcode</title>
                <style>
                    body { 
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: white;
                    }
                    img { 
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <img src="${canvas.toDataURL('image/png')}" />
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
    }
    
    // Copy to clipboard functionality
    copyBtn.addEventListener('click', async function() {
        const type = barcodeType.value;
        let canvas;
        
        try {
            if (type === 'QR') {
                canvas = qrCodeContainer.querySelector('canvas');
            } else {
                const svg = barcodeContainer.querySelector('svg');
                canvas = await svgToCanvas(svg);
            }
            
            if (companyName.value) {
                canvas = addTextToCanvas(canvas, companyName.value, fontSize.value);
            }
            
            canvas.toBlob(async function(blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    showToast('Barcode copied to clipboard!', 'success');
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showToast('Failed to copy barcode', 'danger');
                }
            });
        } catch (e) {
            console.error('Error copying:', e);
            showToast('Error copying barcode', 'danger');
        }
    });
    
    // Show toast notification
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Make all form controls trigger regeneration when changed
    const controls = [barcodeType, barcodeData, companyName, barcodeWidth, barcodeHeight, fontSize, showText, barcodeColor];
    controls.forEach(control => {
        control.addEventListener('change', generateBarcode);
        control.addEventListener('input', generateBarcode);
    });
});
