import { useIncomeTracker } from './useIncomeTracker';
import { Trash2, ArrowDownCircle, RotateCcw, Pencil } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';
import DateInput from '../../components/DateInput';

const IncomeTracker = ({ transactions, settings, fetchTransactions }) => {
  const {
    filterBank,
    setFilterBank,
    selectedMonth,
    setSelectedMonth,
    formData,
    setFormData,
    editingTransaction,
    startEditing,
    cancelEditing,
    handleChange,
    handleSubmit,
    handleDelete,
    availableMonths,
    allFiltered,
    totalInflow,
    totalReimbursed,
    currentMonthKey,
    formatMonthLabel,
  } = useIncomeTracker({ transactions, settings, fetchTransactions });

  // Reimbursement entries — shown separately, NOT counted in income







  const selectStyle = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    cursor: 'pointer'
  };



  return (
    <div className="fade-in">
      <header className="page-header">
        <h2>Income Tracker</h2>
        <p>Log all your credited amounts. Reimbursements from split expenses appear here but are <strong>not counted as income</strong>.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="data-entry-header">
          <div>
            <h3>{editingTransaction ? 'Edit Income' : 'Add Income'}</h3>
            <p>Enter the credited amount and account details below.</p>
          </div>
          {editingTransaction && <span className="data-entry-status">Editing</span>}
        </div>
        <form className="data-entry-form" onSubmit={handleSubmit}>
          <div className="form-row" style={{ paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div className="form-group flex-1">
              <label>Date</label>
              <DateInput
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Source / Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="e.g. Monthly Salary, Upwork Client"
              />
            </div>
            <div className="form-group flex-1">
              <label>Amount (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                onBlur={() => {
                  if (formData.amount !== '') {
                    const parsed = parseFloat(formData.amount);
                    setFormData(prev => ({ ...prev, amount: isNaN(parsed) ? '' : String(parsed) }));
                  }
                }}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Bank / Wallet</label>
              <select name="bank" value={formData.bank} onChange={handleChange} required>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Payment Mode (Service)</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} required>
                {(() => {
                  const selectedBankName = formData.bank || settings?.banks?.[0]?.name || '';
                  const selectedBankObj = settings?.banks?.find(b => b.name === selectedBankName);
                  const supportedServices = selectedBankObj
                    ? selectedBankObj.services
                    : (settings?.paymentModes || ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash']);
                  return supportedServices.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="btn-success" style={{ maxWidth: '240px' }}>
              {editingTransaction ? 'Save Changes' : 'Add Income'}
            </button>
            {editingTransaction && (
              <button type="button" className="btn-secondary" onClick={cancelEditing} style={{ marginLeft: '0.75rem', maxWidth: '160px' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        {/* Header row: title + month selector + account filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Income Log</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              — {formatMonthLabel(selectedMonth)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Month selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={selectStyle}
              >
                {availableMonths.map(mk => (
                  <option key={mk} value={mk}>
                    {formatMonthLabel(mk)}{mk === currentMonthKey ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Account filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Account:</label>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Accounts</option>
                {settings.banks && settings.banks.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary pills */}
        {allFiltered.length > 0 && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderLeft: '3px solid #22c55e',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Income: </span>
              <strong style={{ color: '#22c55e' }}>
                +₹{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {totalReimbursed > 0 && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.15)',
                borderLeft: '3px solid #f97316',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Reimbursements Received: </span>
                <strong style={{ color: '#f97316' }}>
                  +₹{totalReimbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>(not counted in income)</span>
              </div>
            )}

            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--primary-color)',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{allFiltered.length} entries</span>
            </div>
          </div>
        )}

        {/* Income + Reimbursement table (combined, sorted by date) */}
        {allFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No income logged for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '560px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Bank</th>
                  <th>Payment Mode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map(t => {
                  const isReimbursement = t.type === 'Reimbursement';
                  return (
                    <tr key={t._id} style={isReimbursement ? { backgroundColor: 'rgba(249, 115, 22, 0.04)' } : {}}>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDateDisplay(t.date)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isReimbursement
                            ? <RotateCcw size={14} color="#f97316" style={{ flexShrink: 0 }} />
                            : <ArrowDownCircle size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                          }
                          <span>{t.description}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: '700',
                          color: isReimbursement ? '#f97316' : '#22c55e'
                        }}>
                          +₹{t.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {isReimbursement ? (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            color: '#f97316',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            whiteSpace: 'nowrap'
                          }}>
                            Split Reimbursement
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.25)'
                          }}>
                            Income
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{t.bank || ''}</td>
                      <td style={{ color: '#3b82f6' }}>{t.paymentMode}</td>
                      <td>
                        {!isReimbursement && (
                          <button type="button" className="btn-secondary" onClick={() => startEditing(t)} style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} title="Edit income">
                            <Pencil size={15} />
                            <span>Edit</span>
                          </button>
                        )}
                        <button type="button" className="delete-btn" onClick={() => handleDelete(t._id)} style={{ padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeTracker;
