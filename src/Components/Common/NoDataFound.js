import React from 'react';

// Shared empty-state used as the `noDataComponent` for every DataTable in the
// admin portal, so "no rows yet" always looks the same across pages.
const NoDataFound = ({ icon = "ri-inbox-line", title = "No data found", message = "" }) => (
    <div className="text-center py-5">
        <i className={`${icon} display-4 text-muted`}></i>
        <h5 className="mt-3">{title}</h5>
        {message && <p className="text-muted mb-0">{message}</p>}
    </div>
);

export default NoDataFound;
