import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export type TableProps = HTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
};

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={`min-w-full divide-y divide-gray-200 ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

// Compound Components
type TableComponent = typeof Table & {
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Row: typeof TableRow;
  Head: typeof TableHead;
  Cell: typeof TableCell;
};

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <thead ref={ref} className={`bg-gray-50 ${className}`} {...props}>
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tbody ref={ref} className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tr ref={ref} className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

export type TableHeadProps = HTMLAttributes<HTMLTableCellElement>;

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <th
        ref={ref}
        scope="col"
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
        {...props}
      >
        {children}
      </th>
    );
  }
);

TableHead.displayName = 'TableHead';

export type TableCellProps = HTMLAttributes<HTMLTableCellElement>;

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <td ref={ref} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} {...props}>
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

// Attach sub-components to Table
(Table as TableComponent).Header = TableHeader;
(Table as TableComponent).Body = TableBody;
(Table as TableComponent).Row = TableRow;
(Table as TableComponent).Head = TableHead;
(Table as TableComponent).Cell = TableCell;

export default Table as TableComponent;
