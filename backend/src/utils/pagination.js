import { config } from '../config/env.js';

/**
 * Safely parse page and perPage from query parameters.
 * @param {Object} query - Express req.query object
 * @param {Object} options - Default fallback values
 * @returns {Object} { page, perPage, offset }
 */
export const parsePagination = (query, options = {}) => {
  const defaultPage = options.page || 1;
  const defaultPerPage = options.perPage || config.pagination.defaultPerPage || 15;
  const maxPerPage = options.maxPerPage || config.pagination.maxPerPage || 500;

  const page = Math.max(1, Number.parseInt(query.page, 10) || defaultPage);
  const perPage = Math.min(
    Math.max(1, Number.parseInt(query.perPage, 10) || defaultPerPage),
    maxPerPage
  );
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
