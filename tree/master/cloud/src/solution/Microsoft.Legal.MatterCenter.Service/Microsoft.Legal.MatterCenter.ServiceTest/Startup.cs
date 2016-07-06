﻿using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;

#region Matter Namespaces
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.Legal.MatterCenter.Repository;
using Microsoft.Legal.MatterCenter.Service.Filters;
using System.Globalization;
using Microsoft.Legal.MatterCenter.Web.Common;

using System.IO;
using Microsoft.Extensions.Options;
#endregion


namespace Microsoft.Legal.MatterCenter.ServiceTest
{
    public class Startup
    {
        #region Properties
        public IHostingEnvironment HostingEnvironment { get; }
        public ILoggerFactory LoggerFactory { get; }
        public IConfigurationRoot Configuration { get; set; }

        #endregion

        public Startup(IHostingEnvironment env, ILoggerFactory logger)
        {
            this.HostingEnvironment = env;
            this.LoggerFactory = logger;

            var builder = new ConfigurationBuilder()
                .SetBasePath(@"C:\mc\mc2\tree\master\cloud\src\solution\Microsoft.Legal.MatterCenter.Service\Microsoft.Legal.MatterCenter.ServiceTest")
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();

            if (HostingEnvironment.IsDevelopment())
            {
                // This will push telemetry data through Application Insights pipeline faster, allowing you to view results immediately.
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton(Configuration);
            ConfigureSettings(services);
            services.AddCors();
            services.AddLogging();
            ConfigureMvc(services, LoggerFactory);
            // Add framework services.
            services.AddApplicationInsightsTelemetry(Configuration);
            services.AddMvcCore();
            ConfigureMatterPackages(services);
            ConfigureSwagger(services);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory,
            IOptionsMonitor<GeneralSettings> generalSettings,
            IOptionsMonitor<TaxonomySettings> taxonomySettings,
            IOptionsMonitor<MatterSettings> matterSettings,
            IOptionsMonitor<DocumentSettings> documentSettings,
            IOptionsMonitor<SharedSettings> sharedSettings,
            IOptionsMonitor<MailSettings> mailSettings,
            IOptionsMonitor<ListNames> listNames,
            IOptionsMonitor<LogTables> logTables,
            IOptionsMonitor<SearchSettings> searchSettings,
            IOptionsMonitor<CamlQueries> camlQueries,
            IOptionsMonitor<ContentTypesConfig> contentTypesConfig,
            IOptionsMonitor<MatterCenterApplicationInsights> matterCenterApplicationInsights

            )
        {
            //CreateConfig(env);

            var log = loggerFactory.CreateLogger<Startup>();
            try
            {
                loggerFactory.AddConsole(Configuration.GetSection("Logging"));
                loggerFactory.AddDebug();


                generalSettings.OnChange(genSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<GeneralSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", genSettings)}");

                });
                taxonomySettings.OnChange(taxSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<TaxonomySettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", taxSettings)}");
                });
                matterSettings.OnChange(matSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<MatterSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", matSettings)}");
                });
                documentSettings.OnChange(docSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<DocumentSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", docSettings)}");
                });
                sharedSettings.OnChange(shrdSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<SharedSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", shrdSettings)}");
                });
                mailSettings.OnChange(mlSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<MailSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", mlSettings)}");
                });
                listNames.OnChange(lstNames => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<ListNames>>()
                        .LogDebug($"Config changed: {string.Join(", ", lstNames)}");
                });
                logTables.OnChange(logSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<LogTables>>()
                        .LogDebug($"Config changed: {string.Join(", ", logSettings)}");
                });
                searchSettings.OnChange(srchSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<SearchSettings>>()
                        .LogDebug($"Config changed: {string.Join(", ", srchSettings)}");
                });
                camlQueries.OnChange(camlSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<CamlQueries>>()
                        .LogDebug($"Config changed: {string.Join(", ", camlSettings)}");
                });
                contentTypesConfig.OnChange(ctpSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<ContentTypesConfig>>()
                        .LogDebug($"Config changed: {string.Join(", ", ctpSettings)}");
                });


                matterCenterApplicationInsights.OnChange(appInsightSettings => {
                    loggerFactory
                        .CreateLogger<IOptionsMonitor<MatterCenterApplicationInsights>>()
                        .LogDebug($"Config changed: {string.Join(", ", appInsightSettings)}");
                });
                app.UseApplicationInsightsRequestTelemetry();
                if (env.IsDevelopment())
                {
                    app.UseBrowserLink();
                    app.UseDeveloperExceptionPage();
                }
                else
                {
                    app.UseExceptionHandler("/Home/Error");
                }

                app.UseApplicationInsightsExceptionTelemetry();
                app.UseDefaultFiles();
                app.UseStaticFiles();
                CheckAuthorization(app);
                app.UseCors(builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
                app.UseMvc();
                app.UseSwaggerGen();
                app.UseSwaggerUi();
            }
            catch (Exception ex)
            {
                app.Run(
                        async context => {
                            log.LogError($"{ex.Message}");
                            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                            context.Response.ContentType = "text/plain";
                            await context.Response.WriteAsync(ex.Message).ConfigureAwait(false);
                            await context.Response.WriteAsync(ex.StackTrace).ConfigureAwait(false);
                        });

            }
        }

        // Entry point for the application.       

        #region Private Methods

        #region Swagger
        private string pathToDoc = "Microsoft.Legal.MatterCenter.Web.xml";

        private void ConfigureSwagger(IServiceCollection services)
        {
            services.AddSwaggerGen();
            services.ConfigureSwaggerGen(options => {
                options.SingleApiVersion(new Swashbuckle.SwaggerGen.Generator.Info
                {
                    Version = "v1",
                    Title = "Matter Center API Version V1",
                    Description = "This matter center api is for V1 release"
                });
                options.IgnoreObsoleteActions();

            });
            services.ConfigureSwaggerGen(options =>
            {
                options.DescribeAllEnumsAsStrings();
                options.IgnoreObsoleteProperties();

            });
        }


        #endregion

        private void ConfigureMvc(IServiceCollection services, ILoggerFactory logger)
        {
            var builder = services.AddMvc().AddDataAnnotationsLocalization();
            builder.AddJsonOptions(o => {
                o.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                o.SerializerSettings.Converters.Add(new StringEnumConverter());
                o.SerializerSettings.Formatting = Formatting.Indented;
            });
            var instrumentationKey = this.Configuration.GetSection("ApplicationInsights").GetSection("InstrumentationKey").Value.ToString();
            builder.AddMvcOptions(o => { o.Filters.Add(new MatterCenterExceptionFilter(logger, instrumentationKey)); });
        }


        private void ConfigureSettings(IServiceCollection services)
        {
            services.Configure<GeneralSettings>(this.Configuration.GetSection("General"), trackConfigChanges: true);
            services.Configure<TaxonomySettings>(this.Configuration.GetSection("Taxonomy"), trackConfigChanges: true);
            services.Configure<MatterSettings>(this.Configuration.GetSection("Matter"), trackConfigChanges: true);
            services.Configure<DocumentSettings>(this.Configuration.GetSection("Document"), trackConfigChanges: true);
            services.Configure<SharedSettings>(this.Configuration.GetSection("Shared"), trackConfigChanges: true);
            services.Configure<MailSettings>(this.Configuration.GetSection("Mail"), trackConfigChanges: true);
            services.Configure<ErrorSettings>(this.Configuration.GetSection("ErrorMessages"), trackConfigChanges: true);
            services.Configure<ListNames>(this.Configuration.GetSection("ListNames"), trackConfigChanges: true);
            services.Configure<LogTables>(this.Configuration.GetSection("LogTables"), trackConfigChanges: true);
            services.Configure<SearchSettings>(this.Configuration.GetSection("Search"), trackConfigChanges: true);
            services.Configure<CamlQueries>(this.Configuration.GetSection("CamlQueries"), trackConfigChanges: true);
            services.Configure<ContentTypesConfig>(this.Configuration.GetSection("ContentTypes"), trackConfigChanges: true);
            services.Configure<MatterCenterApplicationInsights>(this.Configuration.GetSection("ApplicationInsights"), trackConfigChanges: true);

        }

        private void ConfigureMatterPackages(IServiceCollection services)
        {
            services.AddSingleton<ISPOAuthorization, SPOAuthorization>();
            services.AddSingleton<ITaxonomyRepository, TaxonomyRepository>();
            services.AddScoped<IMatterCenterServiceFunctions, MatterCenterServiceFunctions>();
            services.AddSingleton<ITaxonomy, Taxonomy>();
            services.AddSingleton<ISite, Site>();
            services.AddSingleton<IMatterRepository, MatterRepository>();
            services.AddSingleton<IUsersDetails, UsersDetails>();
            services.AddSingleton<ICustomLogger, CustomLogger>();
            services.AddSingleton<IDocumentRepository, DocumentRepository>();
            services.AddSingleton<ISearch, Search>();
            services.AddSingleton<ISPList, SPList>();
            services.AddSingleton<ISPPage, SPPage>();
            services.AddSingleton<ISharedRepository, SharedRepository>();
            services.AddSingleton<IValidationFunctions, ValidationFunctions>();
            services.AddSingleton<IEditFunctions, EditFunctions>();
            services.AddSingleton<IMatterProvision, MatterProvision>();
            services.AddSingleton<ISPContentTypes, SPContentTypes>();
            services.AddSingleton<IUploadHelperFunctions, UploadHelperFunctions>();
            services.AddSingleton<IUploadHelperFunctionsUtility, UploadHelperFunctionsUtility>();
            services.AddSingleton<IDocumentProvision, DocumentProvision>();
            services.AddSingleton<IUserRepository, UserRepository>();
            services.AddSingleton<IExternalSharing, ExternalSharing>();
        }

        private void CheckAuthorization(IApplicationBuilder app)
        {
            app.UseJwtBearerAuthentication(new JwtBearerOptions()
            {
                AutomaticAuthenticate = true,
                Authority = String.Format(CultureInfo.InvariantCulture,
                    this.Configuration.GetSection("General").GetSection("AADInstance").Value.ToString(),
                    this.Configuration.GetSection("General").GetSection("Tenant").Value.ToString()),
                Audience = this.Configuration.GetSection("General").GetSection("ClientId").Value.ToString(),
                Events = new AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        return Task.FromResult(0);
                    }
                }
            });
        }

        private void CreateConfig(IHostingEnvironment env)
        {

            string destPath = Path.Combine(env.WebRootPath, "app/config.js");
            System.IO.File.WriteAllText(destPath, string.Empty);
            TextWriter tw = new StreamWriter(destPath);
            tw.WriteLine("var configs = { \"uri\":  {");
            tw.WriteLine(" \"SPOsiteURL\": \"" + Configuration["General:SiteURL"] + "\",");
            tw.WriteLine(" \"tenant\": \"" + Configuration["General:Tenant"] + "\",");
            tw.WriteLine("}, \"ADAL\" : { ");
            tw.WriteLine(" \"clientId\": \"" + Configuration["General:ClientId"] + "\"");
            tw.WriteLine("}};");

            tw.Close();
        }

        #endregion
    }
}
