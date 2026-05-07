ALTER TABLE `sales_orders` MODIFY COLUMN `payment_method` enum('cash','credit_card','debit_card','pix','boleto','credit_store','other') DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `product_batches` ADD `xml_code` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `xml_code` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `payment_method` varchar(20) DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `sales` ADD `is_credit_sale` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales` ADD `credit_due_date` date;--> statement-breakpoint
ALTER TABLE `sales` ADD `credit_status` enum('pending','partial','paid') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `sales` ADD `service_order_id` varchar(36);--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `service_order_id` varchar(36);--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `is_credit_sale` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `credit_due_date` date;--> statement-breakpoint
ALTER TABLE `sales_orders` ADD `credit_status` enum('pending','partial','paid') DEFAULT 'pending';--> statement-breakpoint
CREATE INDEX `idx_sales_service_order` ON `sales` (`service_order_id`);--> statement-breakpoint
CREATE INDEX `idx_sales_credit_status` ON `sales` (`credit_status`);--> statement-breakpoint
CREATE INDEX `idx_sales_orders_service_order` ON `sales_orders` (`service_order_id`);