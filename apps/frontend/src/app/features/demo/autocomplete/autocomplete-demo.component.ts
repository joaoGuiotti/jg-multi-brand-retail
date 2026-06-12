import { CommonModule } from '@angular/common';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiAutocompleteComponent } from '@shared/ui/components/autocomplete/autocomplete.component';

@Component({
    selector: 'ui-autocomplete-demo',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, UiAutocompleteComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="p-8 space-y-8 max-w-2xl mx-auto">
            <h1 class="text-2xl font-bold mb-6">Autocomplete Demo</h1>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Basic / Single Selection (with Dropdown Icon)</h2>
                <ui-autocomplete
                    label="Search Country"
                    placeholder="Type to search..."
                    [suggestions]="filteredCountries()"
                    field="name"
                    [dropdown]="true"
                    (completeMethod)="onSearchCountry($event)"
                    [(ngModel)]="selectedCountry"
                ></ui-autocomplete>
                <p class="text-sm text-content-secondary">Selected: {{ selectedCountry() | json }}</p>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Multiple Selection (with Loading State)</h2>
                <ui-autocomplete
                    label="Select Languages"
                    placeholder="Choose languages..."
                    [suggestions]="filteredLanguages()"
                    [multiple]="true"
                    [loading]="loadingLanguages()"
                    (completeMethod)="onSearchLanguage($event)"
                    [(ngModel)]="selectedLanguages"
                ></ui-autocomplete>
                <p class="text-sm text-content-secondary">Selected: {{ selectedLanguages() | json }}</p>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Grouped Selection</h2>
                <ui-autocomplete
                    label="Select Brand (Not Dismissable)"
                    placeholder="Search grouped brands..."
                    [suggestions]="filteredGroups()"
                    [group]="true"
                    groupLabel="label"
                    groupChildren="items"
                    field="name"
                    [dismissable]="false"
                    (completeMethod)="onSearchGroup($event)"
                    [(ngModel)]="selectedGroupItem"
                ></ui-autocomplete>
                <p class="text-sm text-content-secondary">Selected: {{ selectedGroupItem() | json }}</p>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Custom Templates (Item & Group)</h2>
                <ui-autocomplete
                    label="Select Brand with Custom UI"
                    placeholder="Search with custom templates..."
                    [suggestions]="filteredGroups()"
                    [group]="true"
                    groupLabel="label"
                    groupChildren="items"
                    field="name"
                    (completeMethod)="onSearchGroup($event)"
                    [(ngModel)]="selectedGroupItem"
                >
                    <ng-template #groupTemplate let-group>
                        <div class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary font-bold border-b border-primary/5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {{ group.label }}
                        </div>
                    </ng-template>

                    <ng-template #itemTemplate let-item>
                        <div class="flex items-center justify-between w-full">
                            <div class="flex flex-col">
                                <span class="font-medium text-content">{{ item.name }}</span>
                                <span class="text-xs text-content-secondary">Value: {{ item.value }}</span>
                            </div>
                            <span class="px-2 py-0.5 text-[10px] bg-bg-secondary border border-border rounded uppercase tracking-wider text-content-tertiary">
                                Brand
                            </span>
                        </div>
                    </ng-template>
                </ui-autocomplete>
            </section>

            <section class="space-y-4">
                <h2 class="text-lg font-semibold">Reactive Form Integration</h2>
                <form [formGroup]="demoForm" class="space-y-4">
                    <ui-autocomplete
                        label="Reactive Search"
                        formControlName="autocomplete"
                        [suggestions]="filteredCountries()"
                        field="name"
                        (completeMethod)="onSearchCountry($event)"
                    ></ui-autocomplete>
                    <button 
                        type="button"
                        (click)="patchFormValue()"
                        class="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        Patch Brazil
                    </button>
                    <p class="text-sm text-content-secondary">Form Value: {{ demoForm.value | json }}</p>
                </form>
            </section>
        </div>
    `
})
export class UiAutocompleteDemoComponent {
    countries = [
        { name: 'Brazil', code: 'BR' },
        { name: 'United States', code: 'US' },
        { name: 'France', code: 'FR' },
        { name: 'Germany', code: 'DE' },
        { name: 'Japan', code: 'JP' },
        { name: 'China', code: 'CN' }
    ];

    languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'PHP'];

    groupedBrands = [
        {
            label: 'Automotive',
            items: [
                { name: 'Toyota', value: 'TY' },
                { name: 'Honda', value: 'HN' },
                { name: 'Ford', value: 'FD' }
            ]
        },
        {
            label: 'Technology',
            items: [
                { name: 'Apple', value: 'AP' },
                { name: 'Google', value: 'GO' },
                { name: 'Microsoft', value: 'MS' }
            ]
        }
    ];

    filteredCountries = signal<any[]>([]);
    filteredLanguages = signal<any[]>([]);
    filteredGroups = signal<any[]>([]);
    loadingLanguages = signal<boolean>(false);

    selectedCountry = signal<any>(null);
    selectedLanguages = signal<any[]>([]);
    selectedGroupItem = signal<any>(null);

    demoForm = new FormGroup({
        autocomplete: new FormControl<any>(null)
    });

    onSearchCountry(event: any) {
        const query = event.query.toLowerCase();
        this.filteredCountries.set(
            this.countries.filter(c => c.name.toLowerCase().includes(query))
        );
    }

    onSearchLanguage(event: any) {
        const query = event.query.toLowerCase();
        this.loadingLanguages.set(true);

        // Simulate API call
        setTimeout(() => {
            this.filteredLanguages.set(
                this.languages.filter(l => l.toLowerCase().includes(query))
            );
            this.loadingLanguages.set(false);
        }, 1500);
    }

    onSearchGroup(event: any) {
        const query = event.query.toLowerCase();
        const results = this.groupedBrands.map(group => {
            const filteredItems = group.items.filter(item =>
                item.name.toLowerCase().includes(query)
            );
            return filteredItems.length > 0 ? { ...group, items: filteredItems } : null;
        }).filter(g => g !== null) as any[];

        this.filteredGroups.set(results);
    }

    patchFormValue() {
        this.demoForm.get('autocomplete')?.patchValue({ name: 'Brazil', code: 'BR' });
    }
}
