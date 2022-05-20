USE [stocks]
GO

/****** Object:  Table [dbo].[stockecc]    Script Date: 5/20/2022 10:36:38 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[stockecc](
	[Reference] [nvarchar](50) NOT NULL,
	[Description] [nvarchar](255) NULL,
	[Brand] [nvarchar](50) NOT NULL,
	[Stock] [int] NOT NULL,
	[Price] [float] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[BrandShort] [nvarchar](50) NOT NULL
) ON [PRIMARY]
GO
