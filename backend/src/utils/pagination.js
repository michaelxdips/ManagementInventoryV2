export const parsePagination = (query, defaults = {}) => {
    const defaultPage = defaults.page || 1;
    const defaultPerPage = defaults.perPage || 15;
    const maxPerPage = defaults.maxPerPage || 200;

    const rawPage = Number.parseInt(query.page, 10);
    const rawPerPage = Number.parseInt(query.perPage, 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaultPage;
    const perPage = Number.isFinite(rawPerPage) && rawPerPage > 0
        ? Math.min(rawPerPage, maxPerPage)
        : defaultPerPage;
    const offset = (page - 1) * perPage;

    return { page, perPage, offset };
};

export const buildPagination = ({ page, perPage, total }) => ({
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
});

export const sendPaginated = (res, key, rows, pagination) => {
    res.json({
        [key]: rows,
        pagination,
    });
};
