import React, { useState, useEffect } from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from "axios";
import Loader from '../Layout/Loader';

// Sales per day, with an optional start and end date (bar chart)
export default function MonthlySalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const invalidRange = startDate !== '' && endDate !== '' && startDate > endDate

    const salesByDate = async () => {
        try {
            const config = {
                withCredentials: true,
                params: { start: startDate, end: endDate }
            }

            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/sales-by-date`, config)
            setSales(data.salesByDate)
            setError('')
            setLoading(false)

        } catch (error) {
            setLoading(false)
            setError(error.response.data.message || 'Could not load sales')
        }
    }
    useEffect(() => {
        if (!invalidRange) {
            salesByDate()
        }
    }, [startDate, endDate])

    return (
        <div className="mt-5">
            <h3>Sales by Date</h3>
            <div className="row mb-3">
                <div className="col-6 col-md-3">
                    <label htmlFor="start_date">Start date</label>
                    <input
                        type="date"
                        id="start_date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="col-6 col-md-3">
                    <label htmlFor="end_date">End date</label>
                    <input
                        type="date"
                        id="end_date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="col-12 col-md-3 d-flex align-items-end">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setStartDate(''); setEndDate('') }}
                    >
                        Clear
                    </button>
                </div>
            </div>
            {invalidRange && <p className="text-danger">The start date must be before the end date.</p>}
            {error && <p className="text-danger">{error}</p>}
            {loading ? <Loader /> : sales.length === 0 ? (
                <p className="text-center mt-5">No sales in this date range.</p>
            ) : (
                <ResponsiveContainer width="90%" height={400}>
                    <BarChart data={sales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
