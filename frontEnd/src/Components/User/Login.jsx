import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { useDispatch, useSelector } from 'react-redux'
import { login, googleLogin, clearErrors } from '../../actions/userActions'

// the Google button only appears when a client ID is set in frontEnd/.env
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const Login = () => {
    const { isAuthenticated, error, loading, } = useSelector(state => state.auth)
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()

    // form values and validation rules (Formik + Yup)
    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
            password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
        }),
        onSubmit: (values) => {
            dispatch(login(values.email, values.password))
        }
    })

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''

    useEffect(() => {
        if (isAuthenticated && redirect === 'shipping') {
            navigate(`/${redirect}`)
        }
        else if (isAuthenticated)
            navigate('/')
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors());
        }
    }, [error, isAuthenticated, dispatch, navigate, redirect])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <div className="row wrapper">
                        <div className="col-10 col-lg-5">
                            <form className="shadow-lg"
                                onSubmit={formik.handleSubmit}
                            >
                                <h1 className="mb-3">Login</h1>
                                <div className="form-group">
                                    <label htmlFor="email_field">Email</label>
                                    <input
                                        type="email"
                                        id="email_field"
                                        className="form-control"
                                        {...formik.getFieldProps('email')}
                                    />
                                    {formik.touched.email && formik.errors.email && <div className="text-danger small">{formik.errors.email}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input
                                        type="password"
                                        id="password_field"
                                        className="form-control"
                                        {...formik.getFieldProps('password')}
                                    />
                                    {formik.touched.password && formik.errors.password && <div className="text-danger small">{formik.errors.password}</div>}
                                </div>

                                <Link to="/password/forgot" className="float-right mb-4">Forgot Password?</Link>

                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                >
                                    LOGIN
                                </button>

                                <Link to="/register" className="float-right mt-3">New User?</Link>

                                {googleClientId && (
                                    <div className="mt-5 d-flex justify-content-center">
                                        <GoogleOAuthProvider clientId={googleClientId}>
                                            <GoogleLogin
                                                onSuccess={(response) => dispatch(googleLogin(response.credential))}
                                                onError={() => toast.error('Google login failed', { position: 'bottom-right' })}
                                            />
                                        </GoogleOAuthProvider>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>


                </>
            )}
        </>
    )
}
export default Login
