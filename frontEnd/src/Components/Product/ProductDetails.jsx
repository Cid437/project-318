import React, { useState, useEffect } from 'react'
import { useParams, } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { Carousel } from 'react-bootstrap'

import 'react-toastify/dist/ReactToastify.css';
import ListReviews from '../Review/ListReviews';

import { successMsg, errMsg } from '../Utils/helpers'
import { useDispatch, useSelector } from 'react-redux'
import { getProductDetails, newReview, clearErrors, } from '../../actions/productActions'
import { addItemToCart } from '../../actions/cartActions'
import { NEW_REVIEW_RESET } from '../../constants/productConstants'

const ProductDetails = () => {
    const { loading, error, product } = useSelector(state => state.productDetails);
    const { user } = useSelector(state => state.auth);
    const { error: reviewError, success: reviewSuccess } = useSelector(state => state.newReview);
    const [quantity, setQuantity] = useState(1)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    let { id } = useParams()
    const dispatch = useDispatch()

    // the logged-in user's own review of this product (if any), so it can be edited
    const myReview = user && product.reviews
        ? product.reviews.find(review => review.user === user._id)
        : null

    const increaseQty = () => {
        const count = document.querySelector('.count')
        if (count.valueAsNumber >= product.stock) return;
        const qty = count.valueAsNumber + 1;
        setQuantity(qty)
    }

    const decreaseQty = () => {
        const count = document.querySelector('.count')
        if (count.valueAsNumber <= 1) return;
        const qty = count.valueAsNumber - 1;
        setQuantity(qty)
    }

    const addToCart = async () => {
        await dispatch(addItemToCart(id, quantity));
        successMsg('Item added to cart')
    }

    // fill the review form with the user's old review, or start empty
    const openReviewForm = () => {
        setRating(myReview ? myReview.rating : 0)
        setComment(myReview ? myReview.comment : '')
    }

    const reviewHandler = () => {
        if (rating === 0 || comment.trim() === '') {
            errMsg('Please choose a rating and write a comment')
            return
        }
        const formData = new FormData();
        formData.set('rating', rating);
        formData.set('comment', comment);
        formData.set('productId', id);
        dispatch(newReview(formData))
    }

    useEffect(() => {
        dispatch(getProductDetails(id))
    }, [id,]);

    useEffect(() => {
        if (reviewError) {
            errMsg(reviewError)
            dispatch(clearErrors())
        }
        if (reviewSuccess) {
            successMsg('Review saved')
            dispatch({ type: NEW_REVIEW_RESET })
            dispatch(getProductDetails(id))
        }
    }, [dispatch, id, reviewError, reviewSuccess]);

    return (
        <>
            <MetaData title={product.name} />
            <div className="row d-flex justify-content-around">
                <div className="col-12 col-lg-5 img-fluid" id="product_image">
                    <Carousel pause='hover'>
                        {product.images && product.images.map(image => (
                            <Carousel.Item key={image.public_id}>
                                <img className="d-block w-100" src={image.url} alt={product.name} />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </div>

                <div className="col-12 col-lg-5 mt-5">
                    <h3>{product.name}</h3>
                    <p id="product_id">Product # {product._id}</p>

                    <hr />

                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                    </div>
                    <span id="no_of_reviews">({product.numOfReviews} Reviews)</span>

                    <hr />

                    <p id="product_price">${product.price}</p>
                    <div className="stockCounter d-inline">
                        <span className="btn btn-danger minus" onClick={decreaseQty}>-</span>

                        <input type="number" className="form-control count d-inline" value={quantity} readOnly />

                        <span className="btn btn-primary plus" onClick={increaseQty}>+</span>

                    </div>


                    <button type="button" id="cart_btn" className="btn btn-primary d-inline ml-4" disabled={product.stock === 0} onClick={addToCart} >Add to Cart</button>
                    <hr />

                    <p>Status: <span id="stock_status" className={product.stock > 0 ? 'greenColor' : 'redColor'} >{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></p>

                    <hr />

                    <h4 className="mt-2">Description:</h4>
                    <p>{product.description}</p>
                    <hr />
                    <p id="product_seller mb-3">Sold by: <strong>{product.seller}</strong></p>

                    {user ? <button id="review_btn" type="button" className="btn btn-primary mt-4" data-toggle="modal" data-target="#ratingModal" onClick={openReviewForm} >
                        {myReview ? 'Edit Your Review' : 'Submit Your Review'}
                    </button> :
                        <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div>}

                    <div className="row mt-2 mb-5">
                        <div className="rating w-50">

                            <div className="modal fade" id="ratingModal" tabIndex="-1" role="dialog" aria-labelledby="ratingModalLabel" aria-hidden="true">
                                <div className="modal-dialog" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="ratingModalLabel">{myReview ? 'Edit Review' : 'Submit Review'}</h5>
                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">

                                            <ul className="stars" >
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <li
                                                        key={star}
                                                        className={`star ${star <= rating ? 'orange' : ''}`}
                                                        onClick={() => setRating(star)}
                                                    >
                                                        <i className="fa fa-star"></i>
                                                    </li>
                                                ))}
                                            </ul>

                                            <textarea
                                                name="review"
                                                id="review" className="form-control mt-3"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}

                                            >
                                            </textarea>


                                            <button className="btn my-3 float-right review-btn px-4 text-white" data-dismiss="modal" aria-label="Close" onClick={reviewHandler} >Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    {product.reviews && product.reviews.length > 0 && (

                        <ListReviews reviews={product.reviews} />

                    )}
                </div>

            </div>


        </>
    )
}

export default ProductDetails
