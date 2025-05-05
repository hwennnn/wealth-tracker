
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChartBar, Plus, User } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  onLogout: () => void;
};

const Layout = ({ children, onLogout }: LayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container flex justify-between items-center">
          <h1 
            onClick={() => navigate('/')} 
            className="text-xl font-bold cursor-pointer flex items-center"
          >
            <ChartBar className="mr-2" /> Wealth Timeline
          </h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/categories')}
            >
              Categories
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/entries')}
            >
              Entries
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/new-entry')}
            >
              <Plus className="mr-1 h-4 w-4" /> New Entry
            </Button>
            <div className="flex items-center ml-4">
              <User className="h-5 w-5 mr-2" />
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        {children}
      </main>
      <footer className="bg-muted p-4">
        <div className="container text-center text-sm text-muted-foreground">
          Wealth Timeline Tracker © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
