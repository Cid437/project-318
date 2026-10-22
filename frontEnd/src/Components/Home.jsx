import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Product from './Product/Product'
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader';

import { useDispatch, useSelector } from 'react-redux'
import { getProducts } from '../actions/productActions'

const Home = () => {
    const [price, setPrice] = useState([0, 100000]);
    const [currentPage, setCurrentPage] = useState(1)
    const [category, setCategory] = useState('')
    const [rating, setRating] = useState(0)
    const [reviews, setReviews] = useState(0)
    const categories = [
        'Engine Parts',
        'Brakes',
        'Tires/Wheels',
        'Oils/Lubricants',
        'Batteries/Electrical',
        'Helmets',
        'Riding Gear',
        'Accessories',
        'Services'
    ]
    let { keyword } = useParams();
    const dispatch = useDispatch();
    const { loading, products, filteredProductsCount } = useSelector(state => state.products);

    // more products are available while we have loaded fewer than the filtered total
    const hasMore = products.length < filteredProductsCount;

    const handleChange = (event, newValue) => {
        setPrice(newValue);
        setCurrentPage(1)
    };

    function valuetext(price) {
        return `P${price.toString()}`;
    }

    // a new search starts again from the first page
    useEffect(() => {
        setCurrentPage(1)
    }, [keyword]);

    useEffect(() => {
        dispatch(getProducts(currentPage, keyword, price, category, rating, reviews))
    }, [currentPage, keyword, price, category, rating, reviews]);

    // infinite scroll: when the user reaches the bottom, load the next page
    useEffect(() => {
        const loadMore = () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
            if (nearBottom && !loading && hasMore) {
                setCurrentPage(page => page + 1)
            }
        }
        window.addEventListener('scroll', loadMore)
        loadMore() // also check right away in case the loaded products do not fill the screen
        return () => window.removeEventListener('scroll', loadMore)
    }, [loading, hasMore, products.length]);

    return (
        <>
            <MetaData title={'shop Here'} />
            <div className="container container-fluid">
                <h1 id="products_heading">Latest Products</h1>
                <section id="products" className="container mt-5">
                    <div className="row">
                        <div className="col-6 col-md-3 mt-5 mb-5">
                            <Box sx={{ width: 150 }}>
                                <Slider
                                    getAriaLabel={() => 'Price Filter'}
                                    value={price}
                                    onChange={handleChange}
                                    valueLabelDisplay="on"
                                    getAriaValueText={valuetext}
                                    min={0}
                                    max={100000}
                                    step={100}
                                />
                            </Box>
                            <div className="mt-5">
                                <h4 className="mb-3">
                                    Categories
                                </h4>
                                <ul className="pl-0">
                                    <li
                                        style={{ cursor: 'pointer', listStyleType: 'none' }}
                                        className={category === '' ? 'font-weight-bold' : ''}
                                        onClick={() => { setCategory(''); setCurrentPage(1) }}
                                    >
                                        All
                                    </li>
                                    {categories.map(cat => (
                                        <li
                                            style={{ cursor: 'pointer', listStyleType: 'none' }}
                                            className={category === cat ? 'font-weight-bold' : ''}
                                            key={cat}
                                            onClick={() => { setCategory(cat); setCurrentPage(1) }}
                                        >
                                            {cat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-5">
                                <h4 className="mb-3">
                                    Ratings
                                </h4>
                                <ul className="pl-0">
                                    <li
                                        style={{ cursor: 'pointer', listStyleType: 'none' }}
                                        className={rating === 0 ? 'font-weight-bold' : ''}
                                        onClick={() => { setRating(0); setCurrentPage(1) }}
                                    >
                                        Any rating
                                    </li>
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <li
                                            style={{ cursor: 'pointer', listStyleType: 'none' }}
                                            className={rating === star ? 'font-weight-bold' : ''}
                                            key={star}
                                            onClick={() => { setRating(star); setCurrentPage(1) }}
                                        >
                                            <div className="rating-outer">
                                                <div className="rating-inner" style={{ width: `${star * 20}%` }}></div>
                                            </div>
                                            <span className="ml-2">{star < 5 ? '& up' : ''}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-5">
                                <h4 className="mb-3">
                                    Reviews
                                </h4>
                                <select
                                    className="form-control"
                                    value={reviews}
                                    onChange={(e) => { setReviews(Number(e.target.value)); setCurrentPage(1) }}
                                >
                                    <option value={0}>Any</option>
                                    <option value={1}>1 or more</option>
                                    <option value={5}>5 or more</option>
                                    <option value={10}>10 or more</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-6 col-md-9">
                            {loading && products.length === 0 ? <Loader /> : (
                                <>
                                    <div className="row">
                                        {products.map(product => (
                                            <Product key={product._id} product={product} />
                                        ))}
                                    </div>
                                    {loading === false && products.length === 0 && (
                                        <p className="mt-5 text-center">No products found.</p>
                                    )}
                                    {loading && products.length > 0 && (
                                        <p className="mt-4 text-center">Loading more products...</p>
                                    )}
                                    {loading === false && products.length > 0 && !hasMore && (
                                        <p className="mt-4 text-center text-muted">You have reached the end.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Home
