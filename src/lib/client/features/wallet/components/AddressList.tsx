'use client';

import { useTranslations } from 'next-intl';
import { Table, Badge, Button } from '@/components/ui';
import type { AddressItem } from '../action/wallet-actions';

type AddressListProps = {
  addresses: AddressItem[];
  onSetDefault: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function AddressList({ addresses, onSetDefault, onDelete }: AddressListProps): React.JSX.Element {
  const t = useTranslations();

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert(t('wallet.list.cannotDeleteDefault'));
      return;
    }

    if (!confirm(t('wallet.list.deleteConfirm'))) {
      return;
    }

    await onDelete(id);
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('wallet.list.empty')}
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t('wallet.list.label')}</Table.Head>
          <Table.Head>{t('wallet.list.crypto')}</Table.Head>
          <Table.Head>{t('wallet.list.address')}</Table.Head>
          <Table.Head>{t('wallet.list.status')}</Table.Head>
          <Table.Head>{t('wallet.list.operations')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {addresses.map((addr) => (
          <Table.Row key={addr.id}>
            <Table.Cell>{addr.label || '-'}</Table.Cell>
            <Table.Cell>
              <Badge variant="info">{addr.cryptoType}</Badge>
            </Table.Cell>
            <Table.Cell className="font-mono text-sm">{addr.address}</Table.Cell>
            <Table.Cell>
              <div className="flex gap-2">
                {addr.isDefault && <Badge variant="success">{t('common.default')}</Badge>}
                {addr.isActive ? (
                  <Badge variant="success">{t('common.enabled')}</Badge>
                ) : (
                  <Badge variant="default">{t('common.disabled')}</Badge>
                )}
              </div>
            </Table.Cell>
            <Table.Cell>
              <div className="flex gap-2">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSetDefault(addr.id)}
                  >
                    {t('wallet.list.setDefault')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(addr.id, addr.isDefault)}
                  disabled={addr.isDefault}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
