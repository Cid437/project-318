const Order = require('../models/order');
const Product = require('../models/product');
const sendEmail = require('../utils/sendEmail');
const generateReceipt = require('../utils/generateReceipt');



// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    // customers can only open their own orders, admins can open any order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            message: 'You are not allowed to view this order',
        })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
    let totalAmount = 0;

    orders.forEach(order => {

        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })

    }
    return res.status(200).json({
        success: true
    })
}

exports.updateOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',
        })
    }
    if (order.orderStatus === 'Delivered') {
        return res.status(400).json({
            message: 'You have already delivered this order',

        })
    }
    if (!['Processing', 'Shipped', 'Delivered'].includes(req.body.status)) {
        return res.status(400).json({
            message: 'Please select a valid status',
        })
    }

    // stock is reduced only once, when the order first leaves Processing
    if (order.orderStatus === 'Processing' && req.body.status !== 'Processing') {
        for (const item of order.orderItems) {
            await updateStock(item.product, item.quantity)
        }
    }

    order.orderStatus = req.body.status
    if (req.body.status === 'Delivered') {
        order.deliveredAt = Date.now()
    }
    await order.save()

    // email the customer the updated order details with a PDF receipt attached
    try {
        const receipt = await generateReceipt(order)
        const itemRows = order.orderItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
            </tr>`).join('')
        const html = `
            <h3>Hi ${order.user.name}, your order is now ${order.orderStatus}</h3>
            <p>Order ID: ${order._id}</p>
            <table border="1" cellpadding="6" cellspacing="0">
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                ${itemRows}
            </table>
            <p>Items Price: $${Number(order.itemsPrice).toFixed(2)}</p>
            <p>Shipping: $${Number(order.shippingPrice).toFixed(2)}</p>
            <p>Tax: $${Number(order.taxPrice).toFixed(2)}</p>
            <h3>Grand Total: $${Number(order.totalPrice).toFixed(2)}</h3>
            <p>Your receipt is attached.</p>`

        await sendEmail({
            email: order.user.email,
            subject: `MotoShop Order ${order._id} - ${order.orderStatus}`,
            html,
            attachments: [{
                filename: `receipt-${order._id}.pdf`,
                content: receipt,
                contentType: 'application/pdf'
            }]
        })
    } catch (error) {
        // the status is already saved, so a failed email should not fail the update
        console.log(error)
    }

    res.status(200).json({
        success: true,
    })
}

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (!product) return;

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        {
            $project: {
                _id: 0,
                "userDetails.name": true,
                total: true,
            }
        },
        { $sort: { total: 1 } },

    ])
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    res.status(200).json({
        success: true,
        customerSales
    })

}

exports.salesPerMonth = async (req, res, next) => {
    // select monthname(paidAt) sum(price * quantity)
    // from orders
    // group by month(date_placed), year(date_placed)
    const salesPerMonth = await Order.aggregate([

        {
            $group: {
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },

        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', ' Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: true,
                total: true,
            }
        }

    ])
    if (!salesPerMonth) {
        return res.status(404).json({
            message: 'error sales per month',
        })
    }
    res.status(200).json({
        success: true,
        salesPerMonth
    })

}

// Sales per day inside an optional date range  =>  /api/v1/admin/sales-by-date?start=2026-10-01&end=2026-10-31
exports.salesByDate = async (req, res, next) => {
    const { start, end } = req.query
    const match = {}

    // dates are read as Philippine time (+08:00) so a day matches the shop's local day
    if (start || end) {
        match.paidAt = {}
        if (start) {
            match.paidAt.$gte = new Date(`${start}T00:00:00+08:00`)
        }
        if (end) {
            match.paidAt.$lte = new Date(`${end}T23:59:59.999+08:00`)
        }
    }

    const salesByDate = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: '+08:00' } },
                total: { $sum: '$totalPrice' }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                total: true,
            }
        }
    ])
    res.status(200).json({
        success: true,
        salesByDate
    })
}
