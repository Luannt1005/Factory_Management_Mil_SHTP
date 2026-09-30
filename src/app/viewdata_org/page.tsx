'use client';

import { useEffect, useState, useCallback } from "react";
import styles from "./viewdata.module.css";
import { orgchartApi } from "@/features/orgchart/services/orgchartApi";

interface OrgChartRow {
  id: string;
  pid: string | null;
  stpid: string | null;
  name: string;
  title: string;
  image: string | null;
  tags: string;
  orig_pid: string | null;
  dept: string | null;
  BU: string | null;
  type: string;
  location: string | null;
  description: string;
  joiningDate?: string;
}

interface FilterState {
  [key: string]: string;
}

const FILTER_COLUMNS = [
  "name",
  "title",
  "type",
  "dept",
  "id",
  "pid",
  "BU"
];

const ViewDataOrg = () => {
  const [data, setData] = useState<OrgChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orgchartApi.getOrgchart();

      if (result.success) {
        setData((result.data as unknown as OrgChartRow[]) || []);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Filter data
  const filteredData = data.filter((row) => {
    for (const [key, filterValue] of Object.entries(filters)) {
      if (filterValue && String(row[key as keyof OrgChartRow]).toLowerCase() !== filterValue.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Parse tags
  const parseTags = (tagsStr: string): string[] => {
    try {
      return JSON.parse(tagsStr);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>📊 Orgchart Data Viewer</h1>
        <button onClick={loadData} className={styles.btnRefresh}>
          🔄 Refresh
        </button>
      </div>

      {/* FILTERS */}
      <div className={styles.filterBox}>
        <div className={styles.filterRow}>
          {FILTER_COLUMNS.map((key) => (
            <div key={key} className={styles.filterInputWrapper}>
              <label className={styles.filterLabel}>{key}</label>
              <input
                type="text"
                placeholder={`Filter ${key}...`}
                value={filters[key] || ""}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                className={styles.filterInput}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleClearFilters}
          className={styles.btnReset}
        >
          🔄 Clear Filters
        </button>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          Showing <strong>{paginatedData.length}</strong> of{" "}
          <strong>{filteredData.length}</strong> records (Page{" "}
          <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>)
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Title</th>
              <th>Type</th>
              <th>Dept</th>
              <th>BU</th>
              <th>Joining Date</th>
              <th>PID</th>
              <th>STPID</th>
              <th>Location</th>
              <th>Tags</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id}>
                <td className={styles.cellId}>{row.id}</td>
                <td className={styles.cellName}>
                  <div className={styles.nameWrapper}>
                    {row.image && (
                      <img
                        src={row.image}
                        alt={row.name}
                        className={styles.avatar}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span>{row.name}</span>
                  </div>
                </td>
                <td>{row.title}</td>
                <td>
                  <span className={`${styles.badge} ${styles[row.type]}`}>
                    {row.type}
                  </span>
                </td>
                <td>{row.dept || "-"}</td>
                <td>{row.BU || "-"}</td>
                <td className={styles.cellSmall}>{row.joiningDate || "-"}</td>
                <td className={styles.cellSmall}>{row.pid || "-"}</td>
                <td className={styles.cellSmall}>{row.stpid || "-"}</td>
                <td>{row.location || "-"}</td>
                <td>
                  <div className={styles.tags}>
                    {parseTags(row.tags).map((tag, i) => (
                      <span key={i} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.cellSmall}>{row.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className={styles.pagination}>
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={styles.btnPagination}
        >
          ← Previous
        </button>
        <span style={{ margin: "0 15px", fontWeight: "bold" }}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className={styles.btnPagination}
        >
          Next →
        </button>
      </div>

      <div className={styles.paginationInfo}>
        💡 Total records: <strong>{data.length}</strong>
      </div>
    </div>
  );
};

export default ViewDataOrg;
