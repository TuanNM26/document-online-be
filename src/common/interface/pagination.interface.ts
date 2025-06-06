export interface PaginationResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export async function paginate<T>(
  model: any,
  page = 1,
  limit = 10,
  filter: any = {},
  sort: any = {},
  populate?: string | object | Array<string | object>,
): Promise<PaginationResult<T>> {
  let query = model
    .find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort);

  if (populate) {
    query = query.populate(populate);
  }

  const [data, total] = await Promise.all([
    query.lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
