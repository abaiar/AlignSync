"""initial schema

Revision ID: e90b5ee4edc0
Revises:
Create Date: 2026-06-24 20:16:39.794732

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e90b5ee4edc0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. enterprises (no FK deps)
    op.create_table(
        'enterprises',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('bank_account', sa.String(length=100), nullable=True),
        sa.Column('bank_name', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # 2. roles (no FK deps)
    op.create_table(
        'roles',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('enterprise_type', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    # 3. permissions (no FK deps)
    op.create_table(
        'permissions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('module', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )

    # 4. products (no FK deps)
    op.create_table(
        'products',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('spec', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('function_versions', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )

    # 5. users (FK -> enterprises)
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('real_name', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
    )

    # 6. user_roles (FK -> users, roles)
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('role_id', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'role_id'),
    )

    # 7. role_permissions (FK -> roles, permissions)
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.BigInteger(), nullable=False),
        sa.Column('permission_id', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id'),
    )

    # 8. cameras (FK -> enterprises, users)
    op.create_table(
        'cameras',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('internal_id', sa.String(length=100), nullable=False),
        sa.Column('sn', sa.String(length=100), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('intrinsics', sa.JSON(), nullable=False),
        sa.Column('extrinsics', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=True),
        sa.Column('synced_by', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.ForeignKeyConstraint(['synced_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('internal_id'),
        sa.UniqueConstraint('sn'),
    )

    # 9. software_locks (FK -> enterprises, users)
    # NOTE: bound_device_id -> wheel_aligners.id is added via ALTER TABLE below
    # to break the circular dependency with wheel_aligners.
    op.create_table(
        'software_locks',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('lock_id', sa.String(length=100), nullable=False),
        sa.Column('software_version', sa.String(length=100), nullable=False),
        sa.Column('function_version', sa.String(length=100), nullable=False),
        sa.Column('function_list', sa.JSON(), nullable=False),
        sa.Column('expire_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('bound_enterprise_id', sa.BigInteger(), nullable=True),
        sa.Column('bound_device_id', sa.BigInteger(), nullable=True),
        sa.Column('synced_by', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['bound_enterprise_id'], ['enterprises.id'], ),
        sa.ForeignKeyConstraint(['synced_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lock_id'),
    )

    # 10. wheel_aligners (FK -> enterprises, software_locks, users)
    op.create_table(
        'wheel_aligners',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('device_sn', sa.String(length=100), nullable=False),
        sa.Column('device_name', sa.String(length=200), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=False),
        sa.Column('software_lock_id', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('assembled_by', sa.BigInteger(), nullable=False),
        sa.Column('assembled_at', sa.DateTime(), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.ForeignKeyConstraint(['software_lock_id'], ['software_locks.id'], ),
        sa.ForeignKeyConstraint(['assembled_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_sn'),
    )

    # Add the deferred FK: software_locks.bound_device_id -> wheel_aligners.id
    op.create_foreign_key(
        'fk_software_locks_bound_device_id_wheel_aligners',
        'software_locks',
        'wheel_aligners',
        ['bound_device_id'],
        ['id'],
    )

    # 11. purchase_orders (FK -> enterprises, users)
    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_no', sa.String(length=50), nullable=False),
        sa.Column('order_type', sa.String(length=50), nullable=False),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('confirmed_by', sa.BigInteger(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_reason', sa.Text(), nullable=True),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['confirmed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_no'),
    )

    # 12. order_items (FK -> purchase_orders, products)
    op.create_table(
        'order_items',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.BigInteger(), nullable=False),
        sa.Column('product_id', sa.BigInteger(), nullable=False),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.Column('product_model', sa.String(length=100), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('function_version', sa.String(length=100), nullable=True),
        sa.Column('confirmed_quantity', sa.Integer(), nullable=True),
        sa.Column('shipped_quantity', sa.Integer(), nullable=True),
        sa.Column('received_quantity', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['purchase_orders.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    # 13. payments (FK -> purchase_orders, users)
    op.create_table(
        'payments',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.BigInteger(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('payment_account', sa.String(length=200), nullable=True),
        sa.Column('payment_date', sa.DateTime(), nullable=False),
        sa.Column('voucher_path', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('confirmed_by', sa.BigInteger(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['confirmed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['purchase_orders.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    # 14. shipments (FK -> purchase_orders, enterprises, users)
    op.create_table(
        'shipments',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.BigInteger(), nullable=False),
        sa.Column('logistics_company', sa.String(length=200), nullable=False),
        sa.Column('tracking_no', sa.String(length=200), nullable=False),
        sa.Column('target_enterprise_id', sa.BigInteger(), nullable=False),
        sa.Column('shipped_by', sa.BigInteger(), nullable=False),
        sa.Column('shipped_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['purchase_orders.id'], ),
        sa.ForeignKeyConstraint(['shipped_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['target_enterprise_id'], ['enterprises.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    # 15. shipment_items (FK -> shipments, order_items, cameras, software_locks)
    op.create_table(
        'shipment_items',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('shipment_id', sa.BigInteger(), nullable=False),
        sa.Column('order_item_id', sa.BigInteger(), nullable=False),
        sa.Column('item_type', sa.String(length=50), nullable=False),
        sa.Column('item_sn', sa.String(length=100), nullable=False),
        sa.Column('camera_id', sa.BigInteger(), nullable=True),
        sa.Column('software_lock_id', sa.BigInteger(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.id'], ),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ),
        sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ),
        sa.ForeignKeyConstraint(['software_lock_id'], ['software_locks.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    # 16. device_bom (FK -> wheel_aligners, cameras, software_locks)
    op.create_table(
        'device_bom',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('device_id', sa.BigInteger(), nullable=False),
        sa.Column('item_type', sa.String(length=50), nullable=False),
        sa.Column('camera_id', sa.BigInteger(), nullable=True),
        sa.Column('software_lock_id', sa.BigInteger(), nullable=True),
        sa.Column('position_label', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.id'], ),
        sa.ForeignKeyConstraint(['device_id'], ['wheel_aligners.id'], ),
        sa.ForeignKeyConstraint(['software_lock_id'], ['software_locks.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    # 17. after_sales_tickets (FK -> cameras, software_locks, wheel_aligners, enterprises, users)
    op.create_table(
        'after_sales_tickets',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('ticket_no', sa.String(length=50), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('item_sn', sa.String(length=100), nullable=False),
        sa.Column('camera_id', sa.BigInteger(), nullable=True),
        sa.Column('software_lock_id', sa.BigInteger(), nullable=True),
        sa.Column('device_id', sa.BigInteger(), nullable=True),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('handler_id', sa.BigInteger(), nullable=True),
        sa.Column('handled_at', sa.DateTime(), nullable=True),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['device_id'], ['wheel_aligners.id'], ),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.ForeignKeyConstraint(['handler_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['software_lock_id'], ['software_locks.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticket_no'),
    )

    # 18. notifications (FK -> users, enterprises)
    op.create_table(
        'notifications',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('enterprise_id', sa.BigInteger(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('related_type', sa.String(length=50), nullable=True),
        sa.Column('related_id', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['enterprise_id'], ['enterprises.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('after_sales_tickets')
    op.drop_table('device_bom')
    op.drop_table('shipment_items')
    op.drop_table('shipments')
    op.drop_table('payments')
    op.drop_table('order_items')
    op.drop_table('purchase_orders')
    op.drop_table('wheel_aligners')
    op.drop_table('software_locks')
    op.drop_table('cameras')
    op.drop_table('role_permissions')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('products')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_table('enterprises')
