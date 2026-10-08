function FilterBar({filter, setFilter, filters}) {
    return(
    <div className="filters" role="group" aria-label="Filter status">
    {filters.map((f) => (
      <button
        key={f.id}
        type="button"
        className={filter === f.id ? 'is-active' : undefined}
        aria-pressed={filter === f.id}
        onClick={() => setFilter(f.id)}
      >
        {f.label}
      </button>
    ))}
  </div>
  )}

  export default FilterBar