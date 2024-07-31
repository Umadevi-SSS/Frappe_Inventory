frappe.ui.form.on('Material RQ Main', {  
    fetch_data: (frm, cdt, cdn) => {
        console.log(frm.doc.warehouse);
        fetchItemData(frm); 
    },
    on_submit: function (frm) {
        // alert(1)
        if (!frm.doc.material_request || frm.doc.material_request.length === 0) {
            frappe.msgprint(__('Please add items to create Work Orders.'));
            return;
        }
        //Call server-side method to create Work Orders
        frappe.call({
            method: 'inventory.api.stock_list.create_bulk_work_orders',
            args: {
                items: frm.doc.material_request,
                warehouse: frm.doc.warehouse,
                name: frm.doc.name
            },
            callback: function (r) {
                if (r.message) {
                    frappe.msgprint(__('Work Orders created: {0}', [r.message.join(", ")]));
                    fetchItemData(frm);
                    frm.reload_doc();
                }
            }
        });
    },
    refresh: function (frm) {
        frm.set_value("transaction_date", frappe.datetime.nowdate());
        frm.set_df_property('material_request', 'cannot_add_rows', true);
        let elements = document.querySelectorAll("[data-fieldname='fetch_data']");
        elements.forEach(function (element) {
            element.style.marginTop = '26px'; // Adjust the value as needed
        });
        console.log(frm);
          if(frm.doc.docstatus == 1){
            elements.forEach(function (element) {
                element.style.display = 'none'; // Adjust the value as needed
            });
          }
          else{
            elements.forEach(function (element) {
                element.style.display = 'block'; // Adjust the value as needed
            });
          }
        // alert(1)
        // frm.add_custom_button(__('Create Work Orders'), function () {
            // Validate that items are added
            // if (!frm.doc.material_request || frm.doc.material_request.length === 0) {
            //     frappe.msgprint(__('Please add items to create Work Orders.'));
            //     return;
            // }

            // // Call server-side method to create Work Orders
            // frappe.call({
            //     method: 'inventory.api.stock_list.create_bulk_work_orders',
            //     args: {
            //         items: frm.doc.material_request,
            //         warehouse: "Stores - T"
            //     },
            //     callback: function (r) {
            //         if (r.message) {
            //             frappe.msgprint(__('Work Orders created: {0}', [r.message.join(", ")]));
            //         }
            //     }
            // });
        // });
        // frm.add_custom_button(__("Fetch Data 2"), function() {
        //     alert(1);
        //     frappe.call({
        //         method: 'inventory.api.stock_list.get_item_stock_report',
        //         callback: function (r) {
        //             console.log(r);
        //             if (r.message) {
        //                 frm.clear_table('material_request');
        //                 alert(1)
        //                 $.each(r.message, function (i, item) {
        //                     let row = frm.add_child('material_request');
        //                     row.item_code = item.item_code;
        //                     row.item_name = item.item_code;
        //                     row.current_stock = item.actual_qty;
        //                 });
        //                 frm.refresh_field('material_request');
        //             }
        //         }
        //     });
        // });
    }
});
function fetchItemData(frm) {
    frappe.call({
        method: 'inventory.api.stock_list.get_item_stock_report',
        args: {
            warehouse: frm.doc.warehouse,
            transaction_date: frm.doc.transaction_date
        },
        callback: function (r) {
            console.log(r);
            if (r.message) {
                frm.clear_table('material_request');
                var varstatus = 0;
                $.each(r.message, function (i, item) {
                    let row = frm.add_child('material_request');
                    row.item_code = item.item_code;
                    row.item_name = item.item_name;
                    row.current_stock = item.actual_qty;
                    row.required_qty = item.required_qty;
                    row.uom = item.uom;
                    // frappe.show_alert(item);
                    console.log(item);
                    if(item.docstatus == 1){
                        varstatus=1;
                    }
                });
                if(varstatus == 1 && frm.doc.docstatus != 1){
                    frm.page.btn_primary.hide();
                    frappe.show_alert(("Request already created for this date and for this warehouse."))
                }
                else{frm.page.btn_primary.show();}
                frm.refresh_field('material_request');
            }
        }
    });
}
