import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  ChefHat, 
  Clock, 
  Thermometer, 
  Scale,
  Flame,
  AlertTriangle,
  Utensils,
  FileText,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const token = localStorage.getItem('kasaburger_token');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Reçeteler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const sauceRecipes = recipes.filter(r => r.category === 'Soslar');
  const standards = recipes.filter(r => r.category === 'Standartlar');

  const getSpiceLevel = (level) => {
    if (level === 0) return { text: 'Acısız', color: 'bg-green-500' };
    if (level === 1) return { text: '🌶️ Hafif Acı', color: 'bg-yellow-500' };
    if (level === 2) return { text: '🌶️🌶️ Acı', color: 'bg-orange-500' };
    return { text: '🌶️🌶️🌶️ Çok Acı', color: 'bg-red-500' };
  };

  const openRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            Üretim Reçeteleri
          </h1>
          <p className="text-muted-foreground mt-1">
            Kasa Burger 10 kg Sos Üretim Reçeteleri
          </p>
        </div>
      </div>

      <Tabs defaultValue="sauces" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="sauces" className="data-[state=active]:bg-primary">
            <Utensils className="h-4 w-4 mr-2" />
            Sos Reçeteleri ({sauceRecipes.length})
          </TabsTrigger>
          <TabsTrigger value="standards" className="data-[state=active]:bg-primary">
            <FileText className="h-4 w-4 mr-2" />
            Standartlar ({standards.length})
          </TabsTrigger>
        </TabsList>

        {/* Sos Reçeteleri */}
        <TabsContent value="sauces">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sauceRecipes.map((recipe) => {
              const spice = getSpiceLevel(recipe.spice_level);
              return (
                <Card 
                  key={recipe.id} 
                  className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => openRecipeDetail(recipe)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-heading flex items-center gap-2">
                        {recipe.is_premium && <span className="text-yellow-500">⭐</span>}
                        {recipe.name}
                      </CardTitle>
                      <Badge className={spice.color}>{spice.text}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{recipe.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Scale className="h-4 w-4" />
                        {recipe.batch_size}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {recipe.shelf_life}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <Thermometer className="h-4 w-4" />
                        {recipe.storage}
                      </div>
                    </div>
                    
                    {recipe.pairings && recipe.pairings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Önerilen Eşleşme:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.pairings.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full mt-3" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRecipeDetail(recipe);
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Detayları Gör
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Standartlar */}
        <TabsContent value="standards">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {standards.map((standard) => (
              <Card key={standard.id} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {standard.name === 'CCP Gıda Güvenliği Notları' ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Scale className="h-5 w-5 text-primary" />
                    )}
                    {standard.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {standard.name === 'Porsiyon Standartları' && standard.data && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-sm text-muted-foreground">Burger İçi</p>
                          <p className="text-lg font-bold text-primary">{standard.data.burger_ici}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-sm text-muted-foreground">Patates Dip</p>
                          <p className="text-lg font-bold text-primary">{standard.data.patates_dip}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-sm text-muted-foreground">Extra Sos Satış</p>
                          <p className="text-lg font-bold text-primary">{standard.data.extra_sos}</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-sm text-muted-foreground">Sıkma Şişe</p>
                          <p className="text-lg font-bold text-primary">{standard.data.sikma_sise}</p>
                        </div>
                      </div>
                      {standard.notes && (
                        <p className="text-sm text-orange-500 mt-3 p-2 bg-orange-500/10 rounded">
                          ⚠️ {standard.notes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {standard.name === 'CCP Gıda Güvenliği Notları' && Array.isArray(standard.data) && (
                    <ul className="space-y-2">
                      {standard.data.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 font-bold">{i + 1}.</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Etiket Formatı */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Etiket Formatı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-background rounded-lg border font-mono text-sm">
                  "Sos Adı – Üretim: 20.12.2025 16:00 – SKT: 23.12.2025 16:00 – Üreten: …"
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium">Önerilen Raf Ömrü:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Mayo bazlı soslar: <span className="text-primary font-medium">72 saat</span></li>
                    <li>• Yoğurt içeren (Turşu-Ranch): <span className="text-primary font-medium">48 saat</span></li>
                    <li>• Taze sarımsak püreli (Milano): <span className="text-primary font-medium">48-72 saat</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Hızlı Eşleştirme */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Hızlı Eşleştirme (Satış Rehberi)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-background rounded">
                    <span>Klasik Cheeseburger</span>
                    <span className="text-primary font-medium">Burger Ketchup + Kasa Özel</span>
                  </div>
                  <div className="flex justify-between p-2 bg-background rounded">
                    <span>BBQ/Bacon</span>
                    <span className="text-primary font-medium">Smoky BBQ-Mayo</span>
                  </div>
                  <div className="flex justify-between p-2 bg-background rounded">
                    <span>Acılı Seven</span>
                    <span className="text-primary font-medium">Viking / Jalapeño-Lime</span>
                  </div>
                  <div className="flex justify-between p-2 bg-background rounded">
                    <span>Tavuk Burger</span>
                    <span className="text-primary font-medium">Milano / Altın / Jalapeño-Lime</span>
                  </div>
                  <div className="flex justify-between p-2 bg-background rounded">
                    <span>Premium Et</span>
                    <span className="text-primary font-medium">Trüf Mayo (az sür)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                  <ChefHat className="h-6 w-6 text-primary" />
                  {selectedRecipe.is_premium && <span className="text-yellow-500">⭐</span>}
                  {selectedRecipe.name}
                </DialogTitle>
                <p className="text-muted-foreground">{selectedRecipe.description}</p>
              </DialogHeader>

              <div className="space-y-4">
                {/* Meta Info */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-background rounded-lg text-center">
                    <Scale className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Batch</p>
                    <p className="font-bold">{selectedRecipe.batch_size}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Raf Ömrü</p>
                    <p className="font-bold">{selectedRecipe.shelf_life}</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg text-center">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">Acılık</p>
                    <p className="font-bold">{getSpiceLevel(selectedRecipe.spice_level).text}</p>
                  </div>
                </div>

                {/* Ingredients Table */}
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Malzemeler (10 kg için)
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Malzeme</TableHead>
                        <TableHead className="text-right">Miktar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecipe.ingredients?.map((ing, i) => (
                        <TableRow key={i}>
                          <TableCell>{ing.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {ing.amount} {ing.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-primary/10">
                        <TableCell className="font-bold">TOPLAM</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {selectedRecipe.ingredients?.reduce((sum, ing) => sum + ing.amount, 0)} g
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Hazırlama
                  </h3>
                  <p className="p-3 bg-background rounded-lg text-sm">
                    {selectedRecipe.instructions}
                  </p>
                </div>

                {/* Storage */}
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-sm flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Saklama:</span>
                    {selectedRecipe.storage}
                  </p>
                </div>

                {/* Pairings */}
                {selectedRecipe.pairings && selectedRecipe.pairings.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-2">Önerilen Eşleşmeler</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.pairings.map((p, i) => (
                        <Badge key={i} className="bg-primary">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
