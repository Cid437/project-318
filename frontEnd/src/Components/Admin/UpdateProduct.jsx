import React, { useState, useEffect } from 'react'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'

import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { updateProduct, getProductDetails, clearErrors } from '../../actions/productActions'
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants'


const UpdateProduct = () => {
    const dispatch = useDispatch()
    const { error, product } = useSelector(state => state.productDetails);
    const { loading, error: updateError, isUpdated } = useSelector(state => state.product);
    const [images, setImages] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])

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
    let { id } = useParams();
    let navigate = useNavigate();

    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-right'
    });
    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-right'
    });

    // form values and validation rules (Formik + Yup), filled in when the product loads
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: product.name || '',
            price: product.price || '',
            description: product.description || '',
            category: product.category || 'Engine Parts',
            stock: product.stock === undefined ? '' : product.stock,
            seller: product.seller || '',
        },
        validationSchema: Yup.object({
            name: Yup.string().trim().required('Product name is required').max(100, 'Name cannot exceed 100 characters'),
            price: Yup.number().typeError('Price must be a number').positive('Price must be greater than 0').max(99999, 'Price cannot exceed 99999').required('Price is required'),
            description: Yup.string().trim().required('Description is required'),
            category: Yup.string().required('Please select a category'),
            stock: Yup.number().typeError('Stock must be a number').integer('Stock must be a whole number').min(0, 'Stock cannot be negative').max(99999, 'Stock cannot exceed 99999').required('Stock is required'),
            seller: Yup.string().trim().required('Seller name is required'),
        }),
        onSubmit: (values) => {
            const formData = new FormData();
            formData.set('name', values.name);
            formData.set('price', values.price);
            formData.set('description', values.description);
            formData.set('category', values.category);
            formData.set('stock', values.stock);
            formData.set('seller', values.seller);
            images.forEach(image => {
                formData.append('images', image)
            })
            dispatch(updateProduct(product._id, formData))
        }
    })

    const onChange = e => {
        const files = Array.from(e.target.files)
        setImagesPreview([]);
        setImages([])
        setOldImages([])
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(oldArray => [...oldArray, reader.result])
                    setImages(oldArray => [...oldArray, reader.result])
                }
            }
            reader.readAsDataURL(file)
        })
    }

    useEffect(() => {
        if (product && product._id !== id) {
            dispatch(getProductDetails(id))
        } else {
            setOldImages(product.images)
        }
        if (error) {
            errMsg(error)
            dispatch(clearErrors())

        }
        if (updateError) {
            errMsg(updateError);
            dispatch(clearErrors())

        }
        if (isUpdated) {
            navigate('/admin/products');
            successMsg('Product updated successfully');
            dispatch({ type: UPDATE_PRODUCT_RESET })

        }
    }, [error, updateError, product, id, isUpdated])
    return (
        <>
            <MetaData title={'Update Product'} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <>
                        <div className="wrapper my-5">
                            <form className="shadow-lg" onSubmit={formik.handleSubmit} encType='multipart/form-data'>
                                <h1 className="mb-4">Update Product</h1>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        type="text"
                                        id="name_field"
                                        className="form-control"
                                        {...formik.getFieldProps('name')}
                                    />
                                    {formik.touched.name && formik.errors.name && <div className="text-danger small">{formik.errors.name}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="price_field">Price</label>
                                    <input
                                        type="text"
                                        id="price_field"
                                        className="form-control"
                                        {...formik.getFieldProps('price')}
                                    />
                                    {formik.touched.price && formik.errors.price && <div className="text-danger small">{formik.errors.price}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description_field">Description</label>
                                    <textarea className="form-control" id="description_field" rows="8" {...formik.getFieldProps('description')}></textarea>
                                    {formik.touched.description && formik.errors.description && <div className="text-danger small">{formik.errors.description}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="category_field">Category</label>
                                    <select className="form-control" id="category_field" {...formik.getFieldProps('category')}>
                                        {categories.map(category => (
                                            <option key={category} value={category} >{category}</option>
                                        ))}
                                    </select>
                                    {formik.touched.category && formik.errors.category && <div className="text-danger small">{formik.errors.category}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="stock_field">Stock</label>
                                    <input
                                        type="number"
                                        id="stock_field"
                                        className="form-control"
                                        {...formik.getFieldProps('stock')}
                                    />
                                    {formik.touched.stock && formik.errors.stock && <div className="text-danger small">{formik.errors.stock}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="seller_field">Seller Name</label>
                                    <input
                                        type="text"
                                        id="seller_field"
                                        className="form-control"
                                        {...formik.getFieldProps('seller')}
                                    />
                                    {formik.touched.seller && formik.errors.seller && <div className="text-danger small">{formik.errors.seller}</div>}
                                </div>
                                <div className='form-group'>
                                    <label>Images</label>
                                    <div className='custom-file'>
                                        <input
                                            type='file'
                                            name='images'
                                            className='custom-file-input'
                                            id='customFile'
                                            accept='image/*'
                                            onChange={onChange}
                                            multiple
                                        />
                                        <label className='custom-file-label' htmlFor='customFile'>
                                            Choose Images
                                        </label>
                                    </div>
                                    {oldImages && oldImages.map(img => (
                                        <img key={img.public_id} src={img.url} alt={img.url} className="mt-3 mr-2" width="55" height="52" />
                                    ))}
                                    {imagesPreview.map(img => (
                                        <img src={img} key={img} alt="Images Preview" className="mt-3 mr-2" width="55" height="52" />
                                    ))}
                                </div>
                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                    disabled={loading ? true : false}
                                >
                                    UPDATE
                                </button>
                            </form>
                        </div>
                    </>
                </div>
            </div>
        </>
    )
}

export default UpdateProduct
