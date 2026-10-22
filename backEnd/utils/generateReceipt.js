const PDFDocument = require('pdfkit');

// Builds a PDF receipt for an order (order.user must be populated with name and email)
// and returns it as a Buffer so it can be attached to an email.
const generateReceipt = (order) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(22).text('MotoShop Receipt', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Order ID: ${order._id}`);
        doc.text(`Customer: ${order.user.name} (${order.user.email})`);
        doc.text(`Status: ${order.orderStatus}`);
        doc.text(`Date: ${new Date(order.paidAt || order.createdAt).toDateString()}`);
        doc.text(`Ship to: ${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.postalCode}, ${order.shippingInfo.country}`);
        doc.moveDown();

        doc.fontSize(14).text('Items');
        doc.fontSize(12);
        order.orderItems.forEach(item => {
            const subtotal = (item.quantity * item.price).toFixed(2);
            doc.text(`${item.name} - ${item.quantity} x $${item.price} = $${subtotal}`);
        });
        doc.moveDown();

        doc.text(`Items Price: $${Number(order.itemsPrice).toFixed(2)}`);
        doc.text(`Shipping: $${Number(order.shippingPrice).toFixed(2)}`);
        doc.text(`Tax: $${Number(order.taxPrice).toFixed(2)}`);
        doc.moveDown(0.5);
        doc.fontSize(14).text(`Grand Total: $${Number(order.totalPrice).toFixed(2)}`);

        doc.end();
    });
}

module.exports = generateReceipt;
