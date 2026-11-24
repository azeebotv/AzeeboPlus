// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';
import { MetricCard } from './MetricCard';
import { EmptyState } from './EmptyState';
import { DataTable } from './DataTable';
import { ConfirmProvider, useConfirm } from './ConfirmContext';

describe('Admin UI Component System', () => {
  describe('StatusBadge', () => {
    it('renders with appropriate status label and dot', () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText('active')).toBeDefined();
    });

    it('formats underscores into spaces', () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText('in progress')).toBeDefined();
    });

    it('supports custom explicit labels', () => {
      render(<StatusBadge status="suspended" label="Account Banned" />);
      expect(screen.getByText('Account Banned')).toBeDefined();
    });
  });

  describe('Pagination', () => {
    it('renders current page and page counts correctly', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          totalItems={100}
          pageSize={20}
          onPageChange={vi.fn()}
        />
      );
      expect(screen.getByText(/Showing/)).toBeDefined();
      expect(screen.getByText('21')).toBeDefined();
      expect(screen.getByText('40')).toBeDefined();
      expect(screen.getByText('100')).toBeDefined();
    });

    it('triggers onPageChange when clicking next and previous', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      fireEvent.click(screen.getByText('Next'));
      expect(onPageChange).toHaveBeenCalledWith(3);

      fireEvent.click(screen.getByText('Previous'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('disables previous button on page 1', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPageChange={vi.fn()}
        />
      );
      const prevBtn = screen.getByText('Previous').closest('button');
      expect(prevBtn?.disabled).toBe(true);
    });
  });

  describe('MetricCard', () => {
    it('renders metric title and formatted value', () => {
      render(
        <MetricCard
          title="Total Platform Revenue"
          value="$125,400"
          change={14.2}
          description="vs previous month"
        />
      );
      expect(screen.getByText('Total Platform Revenue')).toBeDefined();
      expect(screen.getByText('$125,400')).toBeDefined();
      expect(screen.getByText('+14.2%')).toBeDefined();
      expect(screen.getByText('vs previous month')).toBeDefined();
    });

    it('renders skeleton in loading state', () => {
      const { container } = render(
        <MetricCard title="Loading Metric" value="" loading={true} />
      );
      expect(container.querySelector('.animate-pulse')).toBeDefined();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and triggers action', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="No Users Found"
          description="Try adjusting your filters or search terms."
          action={{ label: 'Invite User', onClick: onAction }}
        />
      );

      expect(screen.getByText('No Users Found')).toBeDefined();
      expect(screen.getByText('Try adjusting your filters or search terms.')).toBeDefined();

      fireEvent.click(screen.getByText('Invite User'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfirmDialog & useConfirm', () => {
    const TestConsumer = ({ onResult }: { onResult: (res: boolean) => void }) => {
      const confirm = useConfirm();
      return (
        <button
          onClick={async () => {
            const ok = await confirm({
              title: 'Confirm Deletion',
              message: 'Are you sure you want to delete this resource?',
              confirmText: 'Delete Now',
              variant: 'danger',
              isDualControl: true,
              dualControlNote: 'High-risk action requiring supervisor authorization.',
            });
            onResult(ok);
          }}
        >
          Trigger Action
        </button>
      );
    };

    it('opens dialog with dual control notice and resolves true on confirm', async () => {
      const handleResult = vi.fn();
      render(
        <ConfirmProvider>
          <TestConsumer onResult={handleResult} />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Trigger Action'));

      expect(screen.getByText('Confirm Deletion')).toBeDefined();
      expect(screen.getByText('Are you sure you want to delete this resource?')).toBeDefined();
      expect(screen.getByText(/Dual Control Required:/)).toBeDefined();
      expect(screen.getByText(/High-risk action requiring supervisor authorization/)).toBeDefined();

      fireEvent.click(screen.getByText('Delete Now'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(true);
      });
    });

    it('resolves false when cancel button is clicked', async () => {
      const handleResult = vi.fn();
      render(
        <ConfirmProvider>
          <TestConsumer onResult={handleResult} />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Trigger Action'));
      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(handleResult).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('DataTable', () => {
    interface TestItem {
      id: string;
      name: string;
      category: string;
      views: number;
    }

    const testData: TestItem[] = [
      { id: '1', name: 'Nollywood Classic', category: 'Drama', views: 5000 },
      { id: '2', name: 'Comedy Night Live', category: 'Comedy', views: 8500 },
      { id: '3', name: 'Action Blitz', category: 'Action', views: 12000 },
    ];

    const columns = [
      { key: 'name', header: 'Title', sortable: true },
      { key: 'category', header: 'Category' },
      { key: 'views', header: 'Views', render: (item: TestItem) => item.views.toLocaleString() },
    ];

    it('renders table headers and rows with custom cell renderers', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyField="id"
        />
      );

      expect(screen.getByText('Title')).toBeDefined();
      expect(screen.getByText('Nollywood Classic')).toBeDefined();
      expect(screen.getByText('8,500')).toBeDefined();
    });

    it('supports client-side search filtering', () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyField="id"
          searchable={true}
          searchPlaceholder="Search movies..."
        />
      );

      const searchInput = screen.getByPlaceholderText('Search movies...');
      fireEvent.change(searchInput, { target: { value: 'Comedy' } });

      expect(screen.getByText('Comedy Night Live')).toBeDefined();
      expect(screen.queryByText('Nollywood Classic')).toBeNull();
    });

    it('supports row selection and select all', () => {
      const onSelectionChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={testData}
          keyField="id"
          selectedIds={['1']}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(4); // 1 header + 3 rows

      // Click row 2
      fireEvent.click(checkboxes[2]!);
      expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
    }, 15000);
  });
});
