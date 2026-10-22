import React, { useState, useEffect } from 'react'
import MetaData from '../Layout/MetaData'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { updateProfile, loadUser, clearErrors } from '../../actions/userActions'

import { UPDATE_PROFILE_RESET } from '../../constants/userConstants'
import { useDispatch, useSelector } from 'react-redux'


const UpdateProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { error, isUpdated, loading } = useSelector(state => state.user)

    const [avatar, setAvatar] = useState('')
    const [avatarPreview, setAvatarPreview] = useState('/images/default_avatar.jpg')
    let navigate = useNavigate();

    // form values and validation rules (Formik + Yup), filled in when the user loads
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: user ? user.name : '',
            email: user ? user.email : '',
        },
        validationSchema: Yup.object({
            name: Yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
            email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
        }),
        onSubmit: (values) => {
            const formData = new FormData();
            formData.set('name', values.name);
            formData.set('email', values.email);
            formData.set('avatar', avatar);
            dispatch(updateProfile(formData))
        }
    })

    useEffect(() => {
        if (user) {
            setAvatarPreview(user.avatar.url)
        }
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors());
        }
        if (isUpdated) {
            toast.success('Profile updated successfully', {
                position: 'bottom-right'
            });
            dispatch(loadUser());
            navigate('/me', { replace: true })
            dispatch({
                type: UPDATE_PROFILE_RESET
            })
        }
    }, [dispatch, error, isUpdated, navigate, user])

    const onChange = e => {
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result)
                setAvatar(reader.result)
            }
        }

        reader.readAsDataURL(e.target.files[0])

    }


    return (
        <>
            <MetaData title={'Update Profile'} />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={formik.handleSubmit} encType='multipart/form-data'>
                        <h1 className="mt-2 mb-5">Update Profile</h1>

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
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                {...formik.getFieldProps('email')}
                            />
                            {formik.touched.email && formik.errors.email && <div className="text-danger small">{formik.errors.email}</div>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor='avatar_upload'>Avatar</label>
                            <div className='d-flex align-items-center'>
                                <div>
                                    <figure className='avatar mr-3 item-rtl'>
                                        <img
                                            src={avatarPreview}
                                            className='rounded-circle'
                                            alt='Avatar Preview'
                                        />
                                    </figure>
                                </div>
                                <div className='custom-file'>
                                    <input
                                        type='file'
                                        name='avatar'
                                        className='custom-file-input'
                                        id='customFile'
                                        accept='image/*'
                                        onChange={onChange}
                                    />
                                    <label className='custom-file-label' htmlFor='customFile'>
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn update-btn btn-block mt-4 mb-3" disabled={loading ? true : false} >Update</button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default UpdateProfile
