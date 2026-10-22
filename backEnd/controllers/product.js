const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');
const Filter = require('bad-words')

const filter = new Filter()
// bad-words only knows English, so add a few common Filipino words too
filter.addWords('gago', 'tanga', 'bobo', 'ulol', 'tarantado', 'putangina', 'tangina')

exports.newProduct = async (req, res, next) => {
    console.log(req.files)
    let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images || []
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        try {
            const result = await cloudinary.v2.uploader.upload(images[i], {

                folder: 'products',
                width: 150,
                crop: "scale",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })

        } catch (error) {
            console.log(error)
        }

    }

    req.body.images = imagesLinks

    const product = await Product.create(req.body);

    if (!product)
        return res.status(400).json({
            success: false,
            message: 'Product not created'
        })


    return res.status(201).json({
        success: true,
        product
    })
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getProducts = async (req, res) => {

    const resPerPage = 4;
    const productsCount = await Product.countDocuments();

    const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter()

    // count the filtered products before pagination limits the result
    const filteredProductsCount = await Product.countDocuments(apiFeatures.query.getFilter());

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
}

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    console.log(req.body)
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else if (req.body.images) {
        images = req.body.images
    }

    // only replace the images when new ones were uploaded, otherwise keep the old ones
    if (images.length > 0) {
        let imagesLinks = [];
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'products',
                width: 150,
                crop: "scale",
            });
            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })

        }
        req.body.images = imagesLinks
    } else {
        delete req.body.images
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindandModify: false
    })
    return res.status(200).json({
        success: true,
        product
    })
}

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.deleteProducts = async (req, res, next) => {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please select products to delete'
        })
    }

    const result = await Product.deleteMany({ _id: { $in: ids } })
    if (result.deletedCount === 0) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: `${result.deletedCount} product(s) deleted`
    })
}

exports.getAdminProducts = async (req, res, next) => {

    const products = await Product.find();
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products
    })

}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    if (!rating || !comment) {
        return res.status(400).json({
            success: false,
            message: 'Please give a rating and write a comment'
        })
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    // only users who already received this product can review it
    const hasReceived = await Order.findOne({
        user: req.user._id,
        orderStatus: 'Delivered',
        'orderItems.product': productId
    })
    if (!hasReceived) {
        return res.status(403).json({
            success: false,
            message: 'You can only review products you have received'
        })
    }

    // mask bad words in the comment (bad-words throws on text with no letters or digits, so skip those)
    const cleanComment = /\w/.test(comment) ? filter.clean(comment) : comment

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment: cleanComment
    }
    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )
    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = cleanComment;
                review.rating = Number(rating);
            }
        })
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
    await product.save({ validateBeforeSave: false });
    return res.status(200).json({
        success: true
    })
}

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
}

exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    // average of the remaining reviews (0 when none are left)
    const ratings = numOfReviews === 0 ? 0 : reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}
