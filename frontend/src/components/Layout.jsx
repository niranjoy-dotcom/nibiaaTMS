import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 py-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {/* Mobile Sidebar Overlay */}
                        {sidebarOpen && (
                            <div
                                className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            ></div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
