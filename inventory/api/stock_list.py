import frappe
from frappe.utils import nowdate

@frappe.whitelist()
def get_item_stock_report(warehouse,transaction_date):
    """
    Fetch a list of items with their current stock.
    """
    paraValues =[]
    paraValues.append(transaction_date)
    paraValues.append(warehouse)
    query = """
         SELECT  A.item_code,  A.warehouse, B.item_name, SUM(actual_qty) as actual_qty,COALESCE(B.required_qty,0) as required_qty,B.docstatus,A.stock_uom AS uom FROM  `tabStock Ledger Entry` A LEFT JOIN (SELECT C.item_code, C.item_name,required_qty,B.docstatus FROM  `tabMasterial RQ` A  INNER JOIN (SELECT * FROM `tabMaterial RQ Main` WHERE DATE(transaction_date) = %s) B ON A.parent = B.name RIGHT JOIN `tabItem` C ON C.name = A.item_code) B ON A.item_code = B.item_code WHERE  warehouse = %s  GROUP BY  item_code, warehouse,B.item_name,required_qty,docstatus,A.stock_uom
    """

    print("12")

    stock_data = frappe.db.sql(query,paraValues, as_dict=True)
    
    print(query)
    return stock_data

@frappe.whitelist()
def create_bulk_work_orders(items,warehouse,name):
    work_order_names = []
    print(items)
    print(warehouse)
    items = frappe.parse_json(items)
    for item in items:
        if (item.get('required_qty') > 0):
            bom_no = frappe.db.get_value("BOM", {"item": item.get('item_code'), "is_active": 1, "is_default": 1}, "name")
            if not bom_no:
                frappe.throw(("No active BOM found for item {0}").format(item.get('item_code')))
            work_order = frappe.new_doc("Work Order")
            work_order.target_warehouse = warehouse
            work_order.fg_warehouse = warehouse
            work_order.production_item = item.get('item_code')  # assuming first item, adjust as necessary
            work_order.qty = item.get('required_qty')  # assuming quantity is same, adjust as necessary
            work_order.sales_order = ''  # assuming you have a sales order field
            work_order.expected_start_date = nowdate()
            work_order.company = frappe.defaults.get_user_default("Company")
            work_order.bom_no = bom_no
            # Save the Work Order
            work_order.save()
            frappe.db.commit()

    frappe.db.set_value('Material RQ Main', name, 'wo_status', "WO Created")
    frappe.db.commit()
    
    return work_order_names
