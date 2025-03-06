-- Companies Table
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name TEXT UNIQUE NOT NULL,
    contact_phone TEXT,
    contact_email TEXT
);

-- Services Table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name TEXT UNIQUE NOT NULL
);

-- Company Services Table
CREATE TABLE company_services (
    company_id INTEGER REFERENCES companies(company_id),
    service_id INTEGER REFERENCES services(service_id),
    is_available BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (company_id, service_id)
);

-- Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT
);

-- Service Slots Table
CREATE TABLE service_slots (
    slot_id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(company_id),
    service_id INTEGER REFERENCES services(service_id),
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE (company_id, service_id, slot_date, slot_time)
);

-- Appointments Table
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    slot_id INTEGER REFERENCES service_slots(slot_id),
    appointment_date Date NOT NULL,
    appointment_time Time NOT NULL,
    notes TEXT,
    is_canceled BOOLEAN DEFAULT FALSE
);